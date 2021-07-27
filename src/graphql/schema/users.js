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
  accredidation_status: Boolean
  investments: [Investment]
  dealInvestments(deal_id: String!): [Investment]
  invitedDeals: [Deal]
  invitedDeal(deal_slug: String!, fund_slug: String!): Deal
  dob: String
  street_address: String
  city: String
  state: String
  zip: String
  mail_country: String
  mail_city: String
  mail_zip: String
  mail_state: String
  mail_street_address: String
  showInvestAndMrkPlc: Boolean
  showCredit: Boolean
  showBuild: Boolean
  source: String
  deals: [Deal]
  investingAs: String
  accountInvestments: [Investment]
  account: Account,
  termsOfServiceCF: Boolean
  profileImageKey: String,
  investorPersonalInfo: Investment
  investorLimits: Object
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
  showInvestAndMrkPlc: Boolean
  showCredit: Boolean
  showBuild: Boolean
  kycDoc: Object
  termsOfServiceCF: Boolean,
  investorLimits: Object
}

type UserPagination {
  count: Int
  users: [User]
}

extend type Query {
  investor(email: String, _id: String, deal_id: String): User
  allInvestors: [User]
  allUsers(pagination: PaginationInput!): UserPagination
  searchUsers(org: String!, q: String!, limit: Int): [User]
  getLink(input: Object): Object
}

extend type Mutation {
  createInvestor(user: UserInput): User
  deleteInvestor(_id: String!): Boolean
  updateUser(input: UserInput): User
  updateInvestor(investment: InvestmentInput): User
  postZap(data: Object): User
  submitTaxDocument(payload: Object): User
}
`)
