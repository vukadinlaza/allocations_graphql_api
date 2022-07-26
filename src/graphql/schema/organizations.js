const { gql } = require("apollo-server-express");

module.exports = gql(`
type Organization {
  _id: String
  name: String
  legal_name: String
  slug: String
  logo: String
  created_at: String
  updated_at: String
  approved: Boolean
  admins: [User]
  investors: [User]
  deals(order_by: String, order_dir: String, offset: Int, limit: Int, status: String): [Deal]
  deal(_id: String): Deal
  n_deals: Int
  investments: [Investment]
  pagInvestments: [Investment]
  adminInvites: [EmailInvite]
  totalAUM: Float
  totalPrivateFunds: Int
  totalFunds: Int
  totalSPVs: Int
  totalFundAUM: Float
  totalSPVAUM: Float
  totalInvestors: Int
  totalClosed: Int
  totalOpen: Int
  totalInvestments: Int
  slackProspects: Int
  high_volume_partner: Boolean
  masterEntity: MasterEntity
  members: [User]
}

type MasterEntity {
  name: String
  address: String
  addressLineTwo: String
  city: String
  state: String
  zipCode: String
  country: String
}


type OrganizationPagination {
  count: Float
  organizations: [Organization]
}

type EmailInvite {
  status: String
  sent_at: Float
  to: String
  opened: Boolean
  opened_at: Float
}

input MasterEntityInput {
  name: String
  address: String
  addressLineTwo: String
  city: String
  state: String
  zipCode: String
  country: String
}

input OrganizationInput {
  _id: String
  name: String
  slug: String
  approved: Boolean
  logo: Upload
  high_volume_partner: Boolean
  masterEntity: MasterEntityInput
}

extend type Query {
  organization(slug: String, _id: String, offset: Int, limit: Int): Organization
  pagOrganizations(pagination: PaginationInput!): OrganizationPagination
  overviewData(slug: String!): Object
  getSyncedOrgs: Object
  
  #TO BE DELETED AUG 4th 2022
  organizationMembers(slug: String!): [User]
}

extend type Mutation {
  createOrganization(organization: OrganizationInput!): Organization
  updateOrganization(organization: OrganizationInput!): Organization
  addOrganizationMembership(slug: String!, user_id: String!): User
  revokeOrganizationMembership(slug: String!, user_id: String!): User
  sendAdminInvite(slug: String!, user_id: String!): EmailInvite
  updateServiceOrg(organization: Object, _id: String): Object
}
`);
