const { ObjectId } = require("mongodb")
const { gql } = require('apollo-server-express')
const { isAdmin } = require('../graphql/permissions')
const { AuthenticationError } = require('apollo-server-express')
const Cloudfront = require('../cloudfront')

const Schema = gql`
  type User {
    _id: String
    investor_type: String
    country: String
    first_name: String
    last_name: String
    entity_name: String
    signer_full_name: String
    accredited_investor_status: String
    email: String
    admin: Boolean
    documents: [Document]
    passport: Document
    investments: [Investment]
    invitedDeals: [Deal]
    invitedDeal(company_name: String!): Deal
  }
`

const User = {
  invitedDeal: async (user, { company_name }, { db }) => {
    const deal = await db.collection("deals").findOne({ company_name, invitedInvestors: ObjectId(user._id) })
    if (deal) return deal
    throw new AuthenticationError()
  },
  investments: (user, _, { db }) => {
    return db.collection("investments").find({ user_id: user._id }).toArray()
  },
  invitedDeals: (user, _, { db }) => {
    return db.collection("deals").find({ closed: { $ne: true }, invitedInvestors: ObjectId(user._id) }).toArray()
  },
  passport: (user) => {
    return user.passport ? { link: Cloudfront.getSignedUrl(user.passport), path: user.passport } : null
  },
}

const Queries = {
  investor: async (_, args, ctx) => {
    // only admins can arbitrarily query
    if (args._id) isAdmin(ctx)

    const query = args._id ? { _id: ObjectId(args._id) } : { email: ctx.user.email }
    return ctx.db.collection("users").findOne(query)        
  }
}

const Mutations = {
  createInvestor: async (_, { user }, ctx) => {
    isAdmin(ctx)

    const res = await ctx.db.collection("users").insertOne(user)
    return res.ops[0]
  },
  deleteInvestor: async (_, { _id }, ctx) => {
    isAdmin(ctx)

    try {
      const res = await ctx.db.collection("users").deleteOne({ _id: ObjectId(_id) })
      return res.deletedCount === 1
    } catch (e) {
      return false
    }
  }
}

module.exports = { Schema, User, Queries, Mutations }