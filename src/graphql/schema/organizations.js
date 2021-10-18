const { gql } = require("apollo-server-express");

// TODO remove offset and limit from organization query

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
  slackProspects: Int
}

input OrganizationInput {
  _id: String
  name: String
  slug: String
  approved: Boolean
  logo: Upload
}

type OrganizationPagination {
  count: Int
  organizations: [Organization]
}

type EmailInvite {
  status: String
  sent_at: Float
  to: String
  opened: Boolean
  opened_at: Float
}

extend type Query {
  organization(slug: String!, offset: Int, limit: Int): Organization
  organizationMembers(slug: String!): [User]
  pagOrganizations(pagination: PaginationInput!): OrganizationPagination
  overviewData(slug: String!): Object
}

extend type Mutation {
  createOrganization(organization: OrganizationInput!): Organization
  updateOrganization(organization: OrganizationInput!): Organization
  deleteOrganization(_id: String!): Boolean

  addOrganizationMembership(slug: String!, user_id: String!): User
  revokeOrganizationMembership(slug: String!, user_id: String!): User
  sendAdminInvite(slug: String!, user_id: String!): EmailInvite
}
`);
