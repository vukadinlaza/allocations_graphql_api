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
    investment: Investment
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

function uuid () {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

const Mutations = {
  createDeal: async (_, deal, ctx) => {
    isAdmin(ctx)
    const res = await ctx.db.collection("deals").insertOne({
      ...deal,
      inviteKey: uuid()
    })
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