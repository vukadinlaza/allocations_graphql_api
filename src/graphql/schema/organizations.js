const { gql } = require('apollo-server-express')

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
    investor(_id: String): User
    deals(order_by: String, order_dir: String, offset: Int, limit: Int, status: String): [Deal]
    deal(_id: String): Deal
    n_deals: Int
    investments: [Investment]
    investment(_id: String): Investment
    adminInvites: [EmailInvite]
    complianceTasks: [ComplianceTask]
    signingRequests: [SigningRequest]
    masterFiling: [Filing]
    completedProvisionOfServices: Boolean
    provisionOfServicesURL: String
    documentTemplates: [DocumentTemplate]
    exchangeDeals: [ExchangeDeal]
    matchRequests: [MatchRequest]
    trades: [Trade]
    orders: [Order]
    orgInvestors: [User]
  }

  type Filing {
    _id: String
    subCategory: String
    step: String
    status: Int
  }

  type DocumentTemplate {
    _id: String
    title: String
  }

  type SigningRequest {
    _id: String
    title: String
    url: String
    status: String
    due: String
  }

  type ComplianceTask {
    _id: String
    task: String
    status: ComplianceTaskStatus
    completed: Boolean
    organization_id: String

    is_signature: Boolean
    signature_template: String
    signature_url: String
  }

  enum ComplianceTaskStatus {
    not_started
    waiting
    in_progress
    done
  }

  input ComplianceTaskInput {
    _id: String
    task: String
    status: ComplianceTaskStatus
    completed: Boolean

    is_signature: Boolean
    signature_template: String
    signature_url: String
  }

  input OrganizationInput {
    _id: String
    name: String
    slug: String
    approved: Boolean
    logo: Upload
  }

  extend type Query {
    organization(slug: String!, offset: Int, limit: Int): Organization
    organizationMembers(slug: String!): [User]
  }

  extend type Mutation {
    createOrganization(organization: OrganizationInput!): Organization
    updateOrganization(organization: OrganizationInput!): Organization
    deleteOrganization(_id: String!): Boolean

    addOrganizationMembership(slug: String!, user_id: String!): User
    revokeOrganizationMembership(slug: String!, user_id: String!): User
    sendAdminInvite(slug: String!, user_id: String!): EmailInvite

    createComplianceTask(slug: String!, complianceTask: ComplianceTaskInput!): ComplianceTask
    updateComplianceTask(slug: String!, complianceTask: ComplianceTaskInput!): ComplianceTask
    deleteComplianceTask(_id: String!): Boolean
  }
`)