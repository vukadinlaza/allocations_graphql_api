const { ObjectId } = require("mongodb")
const { gql } = require('apollo-server-express')
const { isAdmin, isOrgAdmin } = require('../graphql/permissions')
const Cloudfront = require('../cloudfront')
const DealDocUploader = require('../uploaders/deal-docs')
const DealMailer = require('../mailers/deal-mailer')
const logger = require('../utils/logger')
const { AuthenticationError } = require('apollo-server-express')

const Schema = gql`
  type Deal {
    _id: String
    created_at: Int
    organization: String
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
    investment: Investment
    investments: [Investment]
    invitedInvestors: [User]
    allInvited: Boolean
    inviteKey: String
    memo: String
    documents: [Document]
  }

  enum DealStatus {
    onboarding
    closing
    closed
  }

  extend type Query {
    deal(_id: String): Deal
    allDeals: [Deal]
    searchDeals(q: String!, limit: Int): [Deal]
  }

  extend type Mutation {
    updateDeal(org: String!, deal: DealInput!): Deal
    createDeal(org: String!, deal: DealInput!): Deal
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
  }
`

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
  }
}

const Queries = {
  deal: (_, args, ctx) => {
    isAdmin(ctx)
    return ctx.db.collection("deals").findOne({ _id: ObjectId(args._id) })
  },
  allDeals: (_, args, ctx) => {
    isAdmin(ctx)
    return ctx.db.collection("deals").find({}).toArray()
  },
  searchDeals: (_, {q, limit}, ctx) => {
    isAdmin(ctx)
    return ctx.db.collection("deals").find({
      company_name: { $regex: new RegExp(q), $options: "i" }
    }).limit(limit || 10).toArray()
  }
}

function uuid () {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

const Mutations = {
  createDeal: async (_, { deal, org: orgSlug }, ctx) => {
    const org = isOrgAdmin(orgSlug, ctx)
    const res = await ctx.db.collection("deals").insertOne({
      ...deal,
      organization: org._id,
      status: "onboarding",
      created_at: Date.now(),
      inviteKey: uuid()
    })
    return res.ops[0]
  },
  updateDeal: async (_, {org, deal: { _id, wireDoc, ...deal}}, ctx) => {
    isOrgAdmin(org, ctx)

    if (wireDoc) {
      // upload wireDoc
      deal.wireInstructions = await DealDocUploader.addDoc({ doc: wireDoc, title: "wire-instructions" , deal_id: _id })
    }

    const res = await ctx.db.collection("deals").findOneAndUpdate(
      { _id: ObjectId(_id) },
      { $set: deal },
      { returnOriginal: false }
    )
    return res.value
  },
  inviteInvestor: async (_, { org, user_id, deal_id }, ctx) => {
    const orgRecord = isOrgAdmin(org, ctx)
    isAdmin(ctx)

    // we  need to create an empty investment
    await ctx.db.collection("investments").insertOne({
      deal_id: ObjectId(deal_id),
      user_id: ObjectId(user_id),
      organization_id: orgRecord._id,
      status: "invited"
    })

    // add investor to invitedInvestors
    const deal = await ctx.db.collection("deals").updateOne(
      { _id: ObjectId(deal_id) },
      { $push: { invitedInvestors: ObjectId(user_id) } }
    )

    // // send email invite
    // const mailerRes = await DealMailer.sendInvite({ deal, user: ctx.user })
    // logger.info(`Email Invite Status: ${mailerRes.status}`)

    return deal
  },
  uninviteInvestor: (_, { org, user_id, deal_id }, ctx) => {
    isOrgAdmin(org, ctx)
    return ctx.db.collection("deals").updateOne(
      { _id: ObjectId(deal_id) },
      { $pull: { invitedInvestors: ObjectId(user_id) } }
    )
  },
  addDealDoc: async (_, params, ctx) => {
    isAdmin(ctx)
    const path = await DealDocUploader.addDoc(params)
    return ctx.db.collection("deals").updateOne(
      { _id: ObjectId(params.deal_id) },
      { $push: { documents: path } }
    )
  },
  rmDealDoc: async (_, params, ctx) => {
    isAdmin(ctx)
    const path = await DealDocUploader.rmDoc(params)
    return ctx.db.collection("deals").updateOne(
      { _id: ObjectId(params.deal_id) },
      { $pull: { documents: path } }
    )
  }
}

module.exports = { Schema, Deal, Queries, Mutations }