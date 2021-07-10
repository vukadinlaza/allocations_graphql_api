const { ObjectId } = require("mongodb")
const _ = require('lodash')
const fetch = require('node-fetch');
const moment = require('moment');
const { AuthenticationError } = require('apollo-server-express')
const { isAdmin, isOrgAdmin, ensureFundAdmin, isFundAdmin } = require('../permissions')
const Cloudfront = require('../../cloudfront')
const DealDocUploader = require('../../uploaders/deal-docs')
const DealMailer = require('../../mailers/deal-mailer')
const Deals = require('../schema/deals')
const logger = require('../../utils/logger')
const Mailer = require('../../mailers/mailer')
const txConfirmationTemplate = require('../../mailers/templates/tx-confirmation-template')
const { nWithCommas } = require('../../utils/common.js')
// const { pubsub } = require('googleapis/build/src/apis/pubsub')

/**

  Handles all deal logic

 **/

const Schema = Deals

function slugify(str) {
  return str.toLowerCase().replace(' ', '-')
}

function investorInitials(investor) {
  return ((investor.first_name || "").slice(0, 1) + (investor.last_name || "").slice(0, 1)).toUpperCase()
}

const Deal = {
  // investment denotes the `ctx.user` investment in this deal (can only be one)
  investment: (deal, _, { db, user }) => {
    return db.collection("investments").findOne({
      deal_id: ObjectId(deal._id),
      user_id: ObjectId(user._id)
    })
  },
  investments: (deal, _, { db }) => {
    return db.investments.find({ deal_id: deal._id }).toArray()
  },
  invitedInvestors: async (deal, _, { db }) => {
    return db.users.find({ _id: { $in: deal.invitedInvestors || [] } }).toArray()
  },
  wireInstructions: (deal, _, { db }) => {
    return deal.wireInstructions ? Cloudfront.getSignedUrl(deal.wireInstructions) : null
  },
  documents: async (deal, _, { db }) => {
    return deal.documents ? deal.documents.map(d => ({ link: Cloudfront.getSignedUrl(d), path: d.split('/')[2] })) : null
  },
  organization: (deal, _, { db }) => {
    return db.organizations.findOne({ _id: deal.organization })
  },
  approved: async (deal, _, { db }) => {
    const org = await db.organizations.findOne({ _id: deal.organization })
    return org.approved !== false
  },
  dealParams: (deal) => {
    let m = 1
    if (deal.dealParams) {
      m = parseInt(deal.dealParams.dealMultiple || '1')
      deal.dealParams.dealMultiple = m
    }
    return deal.dealParams || {}
  },
  appLink: async (deal, _, { db }) => {
    const { slug } = await db.organizations.findOne({ _id: deal.organization })
    return slug && slug !== "allocations" ? `/deals/${slug}/${deal.slug}` : `/deals/${deal.slug}`
  },
  publicLink: async (deal, _, { db }) => {
    const { slug } = await db.organizations.findOne({ _id: deal.organization })
    return `/public/${slug}/deals/${deal.slug}?invite_code=${deal.inviteKey}`
  },
  pledges: async (deal, _, { db }) => {
    const pledges = await db.investments.find({ deal_id: deal._id, status: { $ne: "invited" } }).toArray()
    return Promise.all(
      pledges.map(async p => {
        const investor = await db.users.findOne({ _id: p.user_id })
        return { amount: p.amount, timestamp: p.pledged_at, initials: investorInitials(investor) }
      })
    )
  },
  raised: async (deal, _, { db }) => {
    const investments = await db.investments.find({ deal_id: deal._id }).toArray()
    const amount = investments.reduce((acc, inv) => {
      const amount = Number.isInteger(inv.amount) ? inv.amount : 0
      return acc + amount
    }, 0)
    return amount
  },
  viewedUsers: async (deal, _, { db }) => {
    return await Promise.all((deal.usersViewed || []).map(user => {
      return db.users.findOne({ _id: user })
    }))
  },
  dealOnboarding: async (deal, _, { db }) => {
    const dealOnboarding = await db.dealOnboarding.findOne({dealName: deal.company_name})
    return dealOnboarding
  }
}

const Queries = {
  deal: async (_, args, ctx) => {
    const org = await ctx.db.organizations.findOne({ slug: args.fund_slug })
    if (org !== null && args.deal_slug) {
      const result = await ctx.db.deals.findOne({ slug: args.deal_slug, organization: ObjectId(org._id) })
      return result
    }
    return ctx.db.deals.findOne({ _id: ObjectId(args._id) })
  },
  allDeals: (_, args, ctx) => {
    isAdmin(ctx)
    return ctx.db.deals.find({}).toArray()
  },
  searchDeals: (_, { q, limit }, ctx) => {
    isAdmin(ctx)
    return ctx.db.deals.find({
      company_name: { $regex: new RegExp(q), $options: "i" }
    }).limit(limit || 10).toArray()
  },
  /** Search query for any deals on an org **/
  searchDealsByOrg: async (_, { q, org: orgSlug, limit }, ctx) => {
    const org = await ensureFundAdmin(orgSlug, ctx)
    return ctx.db.deals.find({
      organization: org._id,
      company_name: { $regex: new RegExp(q), $options: "i" }
    }).limit(limit || 10).toArray()
  },
  /** Public Deal fetches the deal info WITHOUT auth **/
  publicDeal: async (_, { deal_slug, fund_slug, invite_code }, { db }) => {
    const fund = await db.organizations.findOne({ slug: fund_slug })
    const deal = await db.deals.findOne({ slug: deal_slug, organization: fund._id })
    if (deal) {
      return deal
    }
    throw new AuthenticationError("permission denied")
  }
}

function uuid() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

const Mutations = {
  /** create deal ensures there isn't already a deal form org with same name **/
  createDeal: async (_parent, { deal, org: orgSlug }, ctx) => {
    const org = await ensureFundAdmin(orgSlug, ctx)
    const slug = _.kebabCase(deal.company_name)
    // ensure that deal name with org doesn't exist
    const collision = await ctx.db.deals.findOne({ slug, organization: org._id })
    if (collision) {
      throw new Error("Deal with same name already exists")
    }

    if (process.env.NODE_ENV === 'production') {
      await fetch('https://hooks.zapier.com/hooks/catch/7904699/onwul0r/', {
        method: 'post',
        body: JSON.stringify({
          organization: org.name,
          dealName: deal.company_name
        }),
        headers: { 'Content-Type': 'application/json' },
      })
    }


    const res = await ctx.db.deals.insertOne({
      ...deal,
      organization: org._id,
      status: "onboarding",
      dealParams: {},
      slug,
      created_at: Date.now(),
      inviteKey: uuid()
    })
    return res.ops[0]
  },
  /** special handling for wire instructions upload **/
  updateDeal: async (_, { org, deal: { _id, wireDoc, ...deal } }, ctx) => {
    const { user } = ctx;
    console.log('HEREEE')
    ctx.pubsub.publish('dealOnboarding', {dealOnboarding: 'YES'})
    if (deal.isPostingComment) {
      const res = await ctx.db.deals.findOneAndUpdate(
        { _id: ObjectId(_id) },
        {
          $set: {
            ...deal, updated_at: Date.now(),
          }
        },
        { returnOriginal: false }
      )
      return res.value
    }
    await ensureFundAdmin(org, ctx)

    if (wireDoc) {
      // upload wireDoc
      deal.wireInstructions = await DealDocUploader.addDoc({ doc: wireDoc, title: "wire-instructions", deal_id: _id })
    }

    if (deal.status === 'closed') {
      const investments = await ctx.db.investments.aggregate([
        { $match: { deal_id: ObjectId(_id) } },
        {
            $lookup: {
               from: 'users',
               localField: 'user_id',
               foreignField: "_id",
               as: 'user'
             }
         },
         { $unwind: '$user' },
         {
           $project: { user: { email: 1, first_name: 1 }, amount: 1 }
         }
       ]).toArray()

      await ctx.db.investments.updateMany({ deal_id: ObjectId(_id), status: 'wired' }, { $set: { status: 'complete' } })

      if(investments.length && deal && deal.slug === 'luna-mega'){
        const price = 50;
        investments.forEach(async investment => {
          const { user } = investment;
          const emailData = {
            mainData: {
              to: user.email,
              from: "support@allocations.com",
              subject: `Commitment to invest`,
            },
            template: txConfirmationTemplate,
            templateData: {
              username: user.first_name? `${user.first_name}` : user.email,
              issuer: deal.company_name || '',
              type: 'SAFE',
              price,
              totalSold: nWithCommas(investment.amount * 5),
              totalAmount: nWithCommas(investment.amount),
              unitsOwned: nWithCommas(investment.amount/price),
              date: moment(new Date()).format('MMM DD, YYYY')
            }
          }

          await Mailer.sendEmail(emailData)

        });
      }
    }

    const res = await ctx.db.deals.findOneAndUpdate(
      { _id: ObjectId(_id) },
      {
        $set: {
          ...deal, updated_at: Date.now(),
        }
      },
      { returnOriginal: false }
    )
    return res.value
  },
  /** delete Deal and all associated investment records **/
  deleteDeal: async (_, body, ctx) => {
    const { _id } = body
    isAdmin(ctx)

    try {
      // delete deal and all investments in deal
      const s = await ctx.db.investments.deleteMany({ deal_id: ObjectId(_id) })
      const x = await ctx.db.deals.deleteOne({ _id: ObjectId(_id) })
      return true
    } catch (e) {
      console.log(e)
      return false
    }
  },
  /** case where new user is creating an org & a deal simultaneously **/
  createOrgAndDeal: async (_parent, { orgName, deal }, { db, user }) => {
    // no auth required for this (anyone can do it once signed in)

    const slug = _.kebabCase(orgName)
    // ensure no collision
    if (await db.organizations.findOne({ slug })) {
      throw new Error("name collision")
    }

    if (process.env.NODE_ENV === 'production') {
      await fetch('https://hooks.zapier.com/hooks/catch/7904699/onwul0r/', {
        method: 'post',
        body: JSON.stringify({
          organization: orgName,
          dealName: deal.company_name
        }),
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const { ops: [org] } = await db.organizations.insertOne({
      name: orgName,
      created_at: Date.now(),
      slug,
      approved: true
    })

    // add user to org admin
    await db.users.updateOne(
      { _id: user._id },
      { $push: { organizations_admin: org._id } }
    )
    const res = await db.deals.insertOne({
      ...deal,
      slug: _.kebabCase(deal.company_name || deal.airtableId),
      organization: org._id,
      status: deal.status ? deal.status : "onboarding",
      dealParams: {},
      created_at: Date.now(),
      inviteKey: uuid()
    })
    return res.ops[0]
  },
  /** invites user who isn't on platform to a deal and sends them an email invite **/
  inviteNewUser: async (_, { org, email, deal_id }, ctx) => {
    const orgRecord = await ensureFundAdmin(org, ctx)
    const deal = await ctx.db.deals.findOne({ _id: ObjectId(deal_id) })

    // ensure deal is of the org
    const isAllocations = !deal.organization && orgRecord.slug === "allocations"
    const isSameOrg = (deal.organization || 0).toString() === orgRecord._id.toString()
    if (!isAllocations && !isSameOrg) {
      throw new AuthenticationError()
    }

    // if this user does not exist yet on the platform - we are *NOT* going to
    // thats why the emails are tagged with just an email in the non user case
    // create an account for them yet because they have not consented to that
    const invite = await DealMailer.sendInvite({ deal, org: orgRecord, sender: ctx.user, to: email })

    if (invite.status === "sent") {
      // pop email onto deal invites
      await ctx.db.deals.updateOne(
        { _id: ObjectId(deal_id) },
        { $push: { emailInvites: invite } }
      )
    }

    return invite
  },
  /** invites investor to a deal and initializes investment record **/
  inviteInvestor: async (_, { org, user_id, deal_id }, ctx) => {
    const orgRecord = await ensureFundAdmin(org, ctx)
    const deal = await ctx.db.deals.findOne({ _id: ObjectId(deal_id) })

    // ensure deal is of the org
    const isAllocations = !deal.organization && orgRecord.slug === "allocations"
    const isSameOrg = (deal.organization || 0).toString() === orgRecord._id.toString()
    if (!isAllocations && !isSameOrg) {
      throw new AuthenticationError()
    }

    // we  need to create an empty investment
    await ctx.db.collection("investments").insertOne({
      deal_id: ObjectId(deal_id),
      user_id: ObjectId(user_id),
      organization_id: orgRecord._id,
      status: "invited"
    })

    // add investor to invitedInvestors
    const updatedDeal = await ctx.db.deals.updateOne(
      { _id: ObjectId(deal_id) },
      { $push: { invitedInvestors: ObjectId(user_id) } }
    )

    return updatedDeal
  },
  /** unintive investor from deal **/
  uninviteInvestor: async (_, { org, user_id, deal_id }, ctx) => {
    await ensureFundAdmin(org, ctx)
    return ctx.db.deals.updateOne(
      { _id: ObjectId(deal_id) },
      { $pull: { invitedInvestors: ObjectId(user_id) } }
    )
  },
  /** upload deal doc, S3 & db **/
  addDealDoc: async (_, params, ctx) => {
    isAdmin(ctx)
    const path = await DealDocUploader.addDoc(params)
    await ctx.db.deals.updateOne(
      { _id: ObjectId(params.deal_id) },
      { $push: { documents: path } }
    )
    return ctx.db.deals.findOne(
      { _id: ObjectId(params.deal_id) }
    )
  },
  addDealLogo: async (_, params, ctx) => {
    isAdmin(ctx)
    const path = await DealDocUploader.uploadImage(params)
    await ctx.db.deals.updateOne(
      { _id: ObjectId(params.deal_id) },
      { $set: { dealCoverImageKey: path } }
    )
    return ctx.db.deals.findOne(
      { _id: ObjectId(params.deal_id) }
    )
  },
  addDealDocs: async (_, { deal_id, docs }, ctx) => {
    isAdmin(ctx)

    const keys = await docs.map(async doc => {
      const path = await DealDocUploader.addDoc({ deal_id, doc })
      await ctx.db.deals.updateOne(
        { _id: ObjectId(deal_id) },
        { $push: { documents: path } }
      )
      return path
    })
    return ctx.db.deals.findOne(
      { _id: ObjectId(deal_id) })
  },
  /** delete deal doc, S3 & db **/
  rmDealDoc: async (_, params, ctx) => {
    isAdmin(ctx)
    const path = await DealDocUploader.rmDoc(params)
    return ctx.db.deals.updateOne(
      { _id: ObjectId(params.deal_id) },
      { $pull: { documents: path } }
    )
  },
  addUserAsViewed: async (_, { user_id, deal_id }, ctx) => {
    console.log('USER DEAL', user_id, deal_id)
    const deal = await ctx.db.deals.findOne({ _id: ObjectId(deal_id) })
    console.log(deal.usersViewed)
    if ((deal.usersViewed || []).map(i => String(i)).find(id => id === user_id)) {
      return deal
    }
    return ctx.db.deals.updateOne(
      { _id: ObjectId(deal_id) },
      { $push: { usersViewed: ObjectId(user_id) } }
    )
  },
  deleteUserAsViewed: async (_, { user_id, deal_id }, ctx) => {
    const deal = await ctx.db.deals.findOne({ _id: ObjectId(deal_id) })
    return ctx.db.deals.updateOne(
      { _id: ObjectId(deal_id) },
      {
        $pull: { usersViewed: ObjectId(user_id) }
      }
    )
  },


}

const Subscriptions = {
  dealOnboarding: {
    subscribe: async (_, args, { pubsub }) => {
      return pubsub.asyncIterator('dealOnboarding');
    }
  }
}

module.exports = {
  Schema,
  Queries,
  Mutations,
  Subscriptions,
  subResolvers: { Deal }
}
