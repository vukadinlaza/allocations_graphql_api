const { ObjectId } = require("mongodb")
const { isAdmin, isAdminOrSameUser } = require('../graphql/permissions')
const { gql } = require('apollo-server-express')

const Cloudfront = require('../cloudfront')
const Uploader = require('../uploaders/investor-docs')

const Schema = gql`
  type Investment {
    _id: String
    amount: Int
    deal: Deal
    user: User
    status: InvestmentStatus
    documents: [Document]
    investor: User
  }

  enum InvestmentStatus {
    invited
    pledged
    onboarded
    complete
  }

  extend type Mutation {
    createInvestment(investment: InvestmentInput!): Investment
    updateInvestment(investment: InvestmentInput!): Investment
    deleteInvestment(_id: String!): Boolean

    addInvestmentDoc(investment_id: String!, doc: Upload!): String
    rmInvestmentDoc(investment_id: String!, file: String!): Boolean
  }

  input InvestmentInput {
    _id: String
    amount: Int
    deal_id: String
    user_id: String
    status: String
    documents: String
  }
`

const Investment = {
  deal: (investment, _, { db }) => {
    return db.collection("deals").findOne({ _id: investment.deal_id })
  },
  investor: (investment, _, { db }) => {
    return db.collection("users").findOne({ _id: investment.user_id })
  },
  documents: (investment) => {
    if (Array.isArray(investment.documents)) {
      return investment.documents.map(path => {
        return { link: Cloudfront.getSignedUrl(path), path }
      })
    } else {
      return []
    }
  }
}

const Mutations = {
  createInvestment: async (_, { investment: { user_id, deal_id, ...investment }}, ctx) => {
    isAdmin(ctx)
    const res = await ctx.db.collection("investments").insertOne({
      ...investment,
      user_id: ObjectId(user_id),
      deal_id: ObjectId(deal_id),
      status: "invited"
    })
    return res.ops[0]        
  },
  updateInvestment: async (_, { investment: { _id, ...investment }}, ctx) => {
    isAdmin(ctx)
    const res = await ctx.db.collection("investments").findOneAndUpdate(
      { _id: ObjectId(_id) },
      { $set: investment },
      { returnOriginal: false }
    )
    return res.value
  },
  deleteInvestment: async (_, { _id }, ctx) => {
    isAdmin(ctx)

    try {
      const res = await ctx.db.collection("investments").deleteOne({ _id: ObjectId(_id) })
      return res.deletedCount === 1
    } catch (e) {
      return false
    }
  },

  // Document Handling
  addInvestmentDoc: async (_, {investment_id, doc}, ctx) => {
    isAdmin(ctx)

    const file = await doc
    const s3Path = await Uploader.putInvestmentDoc(investment_id, file)

    await ctx.db.collection("investments").updateOne(
      { _id: ObjectId(investment_id) },
      { $addToSet: { documents: s3Path } }
    )

    return Cloudfront.getSignedUrl(s3Path)
  },
  rmInvestmentDoc: async (_, {investment_id, file}, ctx) => {
    isAdmin(ctx)
    await Uploader.rmInvestmentDoc(investment_id, file)
    await ctx.db.collection("investments").updateOne(
      { _id: ObjectId(investment_id) },
      { $pull: { documents: `${investment_id}/${file}` } }
    )
    return true
  }
}

module.exports = { Schema, Mutations, Investment }