const { gql } = require('apollo-server-express')

module.exports = gql(`
type User {
  _id: String
  created_at: String
  investor_type: String
  country: String
  name: String
  first_name: String
  last_name: String
  entity_name: String
  signer_full_name: String
  accredited_investor_status: String
  email: String
  admin: Boolean
  organizations: [String]
  organizations_admin: [Organization]
  terms_of_service: Boolean
  documents: [Object]
  passport: Document
  accredidation_doc: Document
  investments: [Investment]
  invitedDeals: [Deal]
  invitedDeal(deal_slug: String!, fund_slug: String!): Deal
}

input UserInput {
  _id: String
  investor_type: String
  country: String
  first_name: String
  last_name: String
  entity_name: String
  signer_full_name: String
  accredited_investor_status: String
  email: String
  passport: Upload
  accredidation_doc: Upload
  terms_of_service: Boolean
}

extend type Query {
  investor(email: String, _id: String): User
  allInvestors: [User]
  searchUsers(org: String!, q: String!, limit: Int): [User]
  getLink(input: Object): Object
}

extend type Mutation {
  createInvestor(user: UserInput): User
  deleteInvestor(_id: String!): Boolean
  updateUser(input: UserInput): User
  updateInvestor(investment: InvestmentInput): User
}
`)