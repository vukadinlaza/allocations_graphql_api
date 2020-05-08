const { ObjectId } = require("mongodb")
const _ = require('lodash')
const { gql } = require('apollo-server-express')
const { isAdmin, isOrgAdmin, ensureFundAdmin } = require('../graphql/permissions')
const Cloudfront = require('../cloudfront')
const DealDocUploader = require('../uploaders/deal-docs')
const DealMailer = require('../mailers/deal-mailer')
const logger = require('../utils/logger')
const { AuthenticationError } = require('apollo-server-express')

/** 
  
  Handles all deal logic

 **/

const Schema = gql`
  type Deal {
    _id: String
    created_at: String
    approved: Boolean
    organization: Organization
    company_name: String
    slug: String
    company_description: String
    investment_documents: String
    date_closed: String
    deal_lead: String
    pledge_link: String
    onboarding_link: String
    wireInstructions: String
    embed_code: String
    status: DealStatus
    amount: Int
    target: String
    amount_raised: String
    investment: Investment
    investments: [Investment]
    emailInvites: [EmailInvite]
    invitedInvestors: [User]
    allInvited: Boolean
    inviteKey: String
    memo: String
    pledges: [PubPledge]
    documents: [Document]

    appLink: String
    publicLink: String

    dealParams: DealParams

    last_valuation: String
    no_exchange: Boolean
  }

  type DealParams {
    totalRoundSize: String
    allocation: String
    estimatedSetupCosts: String
    totalCarry: String
    totalManagementFee: String
    minimumInvestment: String
  }

  input DealParamsInput {
    totalRoundSize: String
    allocation: String
    estimatedSetupCosts: String
    totalCarry: String
    totalManagementFee: String
    minimumInvestment: String
  }

  type PubPledge {
    amount: Int
    timestamp: String
    initials: String
  }

  type EmailInvite {
    status: String
    sent_at: Float
    to: String
    opened: Boolean
    opened_at: Float
  }

  enum DealStatus {
    onboarding
    closing
    closed
  }

  type Query {
    deal(_id: String): Deal
    allDeals: [Deal]
    publicDeal(deal_slug: String!, fund_slug: String!, invite_code: String!): Deal
    searchDeals(q: String!, limit: Int): [Deal]
    searchDealsByOrg(q: String!, org: String!, limit: Int): [Deal]
  }

  type Mutation {
    updateDeal(org: String!, deal: DealInput!): Deal
    createDeal(org: String!, deal: DealInput!): Deal
    deleteDeal(_id: String!): Boolean
    createOrgAndDeal(orgName: String!, deal: DealInput!): Deal
    inviteNewUser(org: String!, deal_id: String!, email: String!): EmailInvite
    inviteInvestor(org: String!, user_id: String!, deal_id: String!): Deal
    uninviteInvestor(org: String!, user_id: String!, deal_id: String!): Deal
    addDealDoc(deal_id: String!, title: String!, doc: Upload!): Deal
    rmDealDoc(deal_id: String!, title: String!): Deal
  }

  input DealInput {
    _id: String
    company_name: String
    company_description: String
    date_closed: String
    deal_lead: String
    pledge_link: String
    onboarding_link: String
    embed_code: String
    status: String
    closed: Boolean
    allInvited: Boolean
    wireDoc: Upload
    memo: String
    amount: Int
    target: String
    amount_raised: String
    dealParams: DealParamsInput
    last_valuation: String
    no_exchange: Boolean
  }
`

function slugify (str) {
  return str.toLowerCase().replace(' ', '-')
}

function investorInitials (investor) {
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
    return db.users.find({ _id: { $in: deal.invitedInvestors || [] }}).toArray()
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
  }
}

const Queries = {
  deal: (_, args, ctx) => {
    isAdmin(ctx)
    return ctx.db.deals.findOne({ _id: ObjectId(args._id) })
  },
  allDeals: (_, args, ctx) => {
    isAdmin(ctx)
    return ctx.db.deals.find({}).toArray()
  },
  searchDeals: (_, {q, limit}, ctx) => {
    isAdmin(ctx)
    return ctx.db.deals.find({
      company_name: { $regex: new RegExp(q), $options: "i" }
    }).limit(limit || 10).toArray()
  },
  /** Search query for any deals on an org **/
  searchDealsByOrg: async (_, {q, org: orgSlug, limit}, ctx) => {
    const org =  await ensureFundAdmin(orgSlug, ctx)
    return ctx.db.deals.find({
      organization: org._id,
      company_name: { $regex: new RegExp(q), $options: "i" }
    }).limit(limit || 10).toArray()
  },
  /** Public Deal fetches the deal info WITHOUT auth **/
  publicDeal: async (_, { deal_slug, fund_slug, invite_code }, { db }) => {
    const fund = await db.organizations.findOne({ slug: fund_slug })
    const deal = await db.deals.findOne({ slug: deal_slug, organization: fund._id })
    if (deal && deal.inviteKey === invite_code) {
      return deal
    }
    throw new AuthenticationError("permission denied")
  }
}

function uuid () {
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
  updateDeal: async (_, {org, deal: { _id, wireDoc, ...deal}}, ctx) => {
    await ensureFundAdmin(org, ctx)

    if (wireDoc) {
      // upload wireDoc
      deal.wireInstructions = await DealDocUploader.addDoc({ doc: wireDoc, title: "wire-instructions" , deal_id: _id })
    }

    const res = await ctx.db.deals.findOneAndUpdate(
      { _id: ObjectId(_id) },
      { $set: deal },
      { returnOriginal: false }
    )
    return res.value
  },
  /** delete Deal and all associated investment records **/
  deleteDeal: async (_, { _id }, ctx) => {
    isAdmin(ctx)

    try {
      // delete deal and all investments in deal
      await ctx.db.deals.deleteOne({ _id: ObjectId(_id) })
      await ctx.investments.deleteMany({ deal_id: ObjectId(_id) })
      return true
    } catch (e) {
      return false
    }
  },
  /** case where new user is creating an org & a deal simultaneously **/
  createOrgAndDeal: async (_parent, { orgName, deal }, { db, user }) => {
    // no auth required for this (anyone can do it once signed in)

    const { ops: [org] } = await db.organizations.insertOne({
      name: orgName,
      created_at: Date.now(),
      slug: _.kebabCase(orgName),
      approved: false
    })

    // add user to org admin
    await db.users.updateOne(
      { _id: user._id }, 
      { $push: { organizations_admin: org._id } }
    )

    const res = await db.deals.insertOne({ 
      ...deal,
      slug: _.kebabCase(deal.company_name),
      organization: org._id,
      status: "onboarding",
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
    return ctx.db.deals.updateOne(
      { _id: ObjectId(params.deal_id) },
      { $push: { documents: path } }
    )
  },
  /** delete deal doc, S3 & db **/
  rmDealDoc: async (_, params, ctx) => {
    isAdmin(ctx)
    const path = await DealDocUploader.rmDoc(params)
    return ctx.db.deals.updateOne(
      { _id: ObjectId(params.deal_id) },
      { $pull: { documents: path } }
    )
  }
}

module.exports = { 
  Schema, 
  Queries,
  Mutations,
  subResolvers: { Deal } 
}
