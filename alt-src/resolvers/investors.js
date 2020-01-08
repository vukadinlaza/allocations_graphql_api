const { ObjectId } = require("mongodb")
const { gql } = require('apollo-server-express')
const { isAdmin } = require('../graphql/permissions')

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
  }
`

async function investor (_, args, ctx) {
  // only admins can arbitrarily query
  if (args._id) isAdmin(ctx)

  const query = args._id ? { _id: ObjectId(args._id) } : { email: ctx.user.email }
  return ctx.db.collection("users").findOne(query)        
}

async function createInvestor (_, { user }, ctx) {
  isAdmin(ctx)

  const res = await ctx.db.collection("users").insertOne(user)
  return res.ops[0]
}

async function deleteInvestor (_, { _id }, ctx) {
  isAdmin(ctx)

  try {
    const res = await ctx.db.collection("users").deleteOne({ _id: ObjectId(_id) })
    return res.deletedCount === 1
  } catch (e) {
    return false
  }
}

module.exports = {
  Schema,
  Queries: {
    investor
  },
  Mutations: {
    createInvestor,
    deleteInvestor
  }
}