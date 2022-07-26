const { gql } = require("apollo-server-express");

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
  dealInvestments(deal_id: String): [Investment]
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
  termsOfServiceCF: Boolean
  profileImageKey: String,
  investorPersonalInfo: Investment
  investorLimits: Object
  investorTaxDocuments: [Object]
  investmentAmount: Int
  investmentsCount: Int
  avgMultiple: Float
  portfolioValue: Float
  allocations_angel: Boolean
  linkedinUrl: String
  sectors: [String]
  stages: [String]
  slackAmount: Int
  username: String
  display_username: Boolean
  profileBio: String
  serviceInvestments: [Object]
}

type UserPagination {
  count: Int
  users: [User]
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
  accredidation_status: Boolean
  terms_of_service: Boolean
  showInvestAndMrkPlc: Boolean
  showCredit: Boolean
  showBuild: Boolean
  kycDoc: Object
  termsOfServiceCF: Boolean
  investorLimits: Object
  state: String
  linkedinUrl: String
  username: String
  display_username: Boolean
  city: String
  profileBio: String
  sectors: [String],
  stages: [String]
}

extend type Query {
  user(email: String, _id: String, deal_id: String): User
  users(query: Object, org_id: String): [User]
  usersById(userIds: [String]): [User]
  searchUsers(fields: [String]!, searchTerm: String): [User]
  allUsers(pagination: PaginationInput!, additionalFilter: Object): UserPagination
  
  #TO BE DELETED AUG 4th 2022
  investor(email: String, _id: String, deal_id: String): User
  investorsLookupById(userIds: [String]): [User]
  searchUsersByEmail(q: [String!]): [User]
}

extend type Mutation {
  createUser(user: UserInput): User
  deleteUser(_id: String!): Boolean
  updateUser(input: UserInput): User
  submitTaxDocument(payload: Object): User
  updateProfileImage(email: String!, image: Upload): User
  deleteProfileImage(email: String!, profileImageKey: String!): User
  mergeAccounts(payload: Object!): Object 

  #TO BE DELETED AUG 4th 2022
  addSectors(email: String!, sector: String!): User
  deleteSectors(email: String!, sector: String!): User
  addStages(email: String!, stage: String!): User
  deleteStages(email: String!, stage: String!): User
  displayUsernameStatus(email: String!, display_username: Boolean): User
  createInvestor(user: UserInput): User
  updateInvestorLinkedin(email: String!, linkedinUrl: String): User
  addFirstAndLastName(email: String!, first_name: String, last_name: String): User
}
`);
