const { ObjectId } = require("mongodb")
const { gql } = require('apollo-server-express')
const { isAdmin } = require('../graphql/permissions')
const { AuthenticationError } = require('apollo-server-express')

const Schema = gql`
  type Deal {
    _id: String
    company_name: String
    company_description: String
    investment_documents: String
    date_closed: String
    deal_lead: String
    pledge_link: String
    onboarding_link: String
    embed_code: String
    status: String
    closed: Boolean
    amount: Int
    investments: [Investment]
    invitedInvestors: [User]
    inviteKey: String
  }

  extend type Mutation {
    updateDeal(deal: DealInput!): Deal
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
    amount: Int
  }
`

const Deal = {
  investments: (deal, _, { db }) => {
    return db.collection("investments").find({ deal_id: deal._id }).toArray()
  },
  invitedInvestors: async (deal, _, { db }) => {
    return db.collection("users").find({ _id: { $in: deal.invitedInvestors || [] }}).toArray()
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
  }
}

const Mutations = {
  createDeal: async (_, deal, ctx) => {
    isAdmin(ctx)
    const res = await ctx.db.collection("deals").insertOne(deal)
    return res.ops[0]
  },
  updateDeal: async (_, {deal: { _id, ...deal}}, ctx) => {
    isAdmin(ctx)
    const res = await ctx.db.collection("deals").findOneAndUpdate(
      { _id: ObjectId(_id) },
      { $set: deal },
      { returnOriginal: false }
    )
    return res.value
  }
}

module.exports = { Schema, Deal, Queries, Mutations }