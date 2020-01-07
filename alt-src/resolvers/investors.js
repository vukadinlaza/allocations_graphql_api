const { ObjectId } = require("mongodb")
const { AuthenticationError, gql } = require('apollo-server-express')
const { isAdmin, isAdminOrSameUser } = require('../graphql/permissions')

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
  // admin or the _correct_ user
  isAdminOrSameUser(args, ctx)

  // ensure one query param sent
  if (!args._id && !args.email) {
    throw new AuthenticationError('permission denied');
  }

  const query = args._id ? { _id: ObjectId(args._id) } : { email: args.email }
  return db.collection("users").findOne(query)        
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
  Query: {
    investor
  },
  Mutations: {
    createInvestor,
    deleteInvestor
  }
}