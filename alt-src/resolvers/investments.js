const { ObjectId } = require("mongodb")
const { isAdmin, isAdminOrSameUser } = require('../graphql/permissions')
const { gql } = require('apollo-server-express')

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
    viewed
    pledged
    onboarded
    complete
  }

  input InvestmentInput {
    _id: String
    amount: Int
    deal_id: String
    user_id: String
    documents: String
  }
`

const Mutations = {
  createInvestment: async (_, { investment: { user_id, deal_id, ...investment }}, ctx) => {
    isAdmin(ctx)
    const res = await db.collection("investments").insertOne({
      ...investment,
      user_id: ObjectId(user_id),
      deal_id: ObjectId(deal_id),
      status: "viewed"
    })
    return res.ops[0]        
  },
  deleteInvestment: async (_, { _id }, ctx) => {
    isAdmin(ctx)

    try {
      const res = await ctx.db.collection("investments").deleteOne({ _id: ObjectId(_id) })
      return res.deletedCount === 1
    } catch (e) {
      return false
    }
  }
}

module.exports = { Schema, Mutations }