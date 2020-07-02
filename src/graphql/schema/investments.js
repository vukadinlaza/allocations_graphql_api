const { gql } = require('apollo-server-express')

module.exports = gql(`
type Investment {
  _id: String

  invited_at: Int
  pledged_at: Int
  onboarded_at: Int
  completed_at: Int

  organization: String
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

extend type Query {
  investment(_id: String): Investment
  allInvestments: [Investment]
}

extend type Mutation {
  createInvestment(investment: InvestmentInput!): Investment!
  updateInvestment(investment: InvestmentInput!): Investment!
  deleteInvestment(_id: String!): Boolean

  addInvestmentDoc(investment_id: String!, doc: Upload!): String
  rmInvestmentDoc(investment_id: String!, file: String!): Boolean
}

scalar Object

input InvestmentInput {
  _id: String
  amount: Int
  deal_id: String
  user_id: String
  status: String
  documents: [Object]
}
`)