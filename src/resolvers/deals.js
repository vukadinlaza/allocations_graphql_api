const { ObjectId } = require("mongodb")
const _ = require('lodash')
const { gql } = require('apollo-server-express')
const { isAdmin, isOrgAdmin, ensureFundAdmin } = require('../graphql/permissions')
const Cloudfront = require('../cloudfront')
const DealDocUploader = require('../uploaders/deal-docs')
const DealMailer = require('../mailers/deal-mailer')
const logger = require('../utils/logger')
const { AuthenticationError } = require('apollo-server-express')

const Schema = gql`
  type Deal {
    _id: String
    created_at: String
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
    documents: [Document]

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

const Deal = {
  // investment denotes the `ctx.user` investment in this deal (can only be one)
  investment: (deal, _, { db, user }) => {
    return db.collection("investments").findOne({ 
      deal_id: ObjectId(deal._id),
      user_id: ObjectId(user._id)  
    })
  },
  investments: (deal, _, { db }) => {
    return db.collection("investments").find({ deal_id: deal._id }).toArray()
  },
  invitedInvestors: async (deal, _, { db }) => {
    return db.collection("users").find({ _id: { $in: deal.invitedInvestors || [] }}).toArray()
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
  dealParams: (deal) => {
    return deal.dealParams || {}
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
  searchDealsByOrg: async (_, {q, org: orgSlug, limit}, ctx) => {
    const org =  await ensureFundAdmin(orgSlug, ctx)
    return ctx.db.deals.find({
      organization: org._id,
      company_name: { $regex: new RegExp(q), $options: "i" }
    }).limit(limit || 10).toArray()
  },
  publicDeal: async (_, { deal_slug, fund_slug, invite_code }, { db }) => {
    const fund = await db.organizations.findOne({ slug: fund_slug })
    const deal = await db.deals.findOne({ slug: deal_slug, organization: fund._id })
    if (deal && deal.inviteKey === invite_code) {
      return deal
    }
    throw new AuthenticationError()
  }
}

function uuid () {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

const Mutations = {
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
  uninviteInvestor: async (_, { org, user_id, deal_id }, ctx) => {
    await ensureFundAdmin(org, ctx)
    return ctx.db.deals.updateOne(
      { _id: ObjectId(deal_id) },
      { $pull: { invitedInvestors: ObjectId(user_id) } }
    )
  },
  addDealDoc: async (_, params, ctx) => {
    isAdmin(ctx)
    const path = await DealDocUploader.addDoc(params)
    return ctx.db.deals.updateOne(
      { _id: ObjectId(params.deal_id) },
      { $push: { documents: path } }
    )
  },
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
