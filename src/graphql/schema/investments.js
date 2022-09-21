const { gql } = require("apollo-server-express");

module.exports = gql(`
scalar Object

type Investment {
  _id: String
  value: Float
  invited_at: Int
  pledged_at: Int
  onboarded_at: Int
  completed_at: Int
  organization: String
  amount: Float
  capitalWiredAmount: Float
  deal: Deal
  user: User
  status: InvestmentStatus
  documents: [Document]
  investor: User
  created_at: String
  updated_at: String
  metaData: Object
  submissionData: SubmissionData
  previewLink: String
  slack_investment: Boolean
  wire_instructions: Document
  wired_at: Float
}

type SubmissionData {
  country: String
  state: String
  investor_type: String
  legalName: String
  accredited_investor_status: String
  fullName: String
  title: String
  investmentId: String
  submissionId: String
}

type InvestmentPagination {
  count: Int
  investments: [Investment]
}

enum InvestmentStatus {
  invited
  onboarded
  complete
  signed
  wired
  pledged
}

input InvestmentInput {
  _id: String
  amount: Float
  deal_id: String
  user_id: String
  status: String
  documents: [Object]
  capitalWiredAmount: Float
  wired_at: Float
}

input PaginationInput {
  pagination: Int!
  currentPage: Int!
  filterField: String
  filterValue: String
  filterNestedKey: String
  filterNestedCollection: String
  filterLocalFieldKey: String
  sortField: String
  sortOrder: Int
  sortNestedKey: String
  sortNestedCollection: String
  sortLocalFieldKey: String
}

extend type Query {
  investment(_id: String): Investment
  investments(query: Object): [Investment]
  investmentsList(pagination: PaginationInput!): InvestmentPagination
  newInvestment(_id: String): Object
}

extend type Mutation {
  createInvestment(investment: InvestmentInput!): Investment!
  createLegacyInvestment(investment: Object!): Investment!
  updateInvestment(investment: InvestmentInput!): Investment!
  getInvestmentPreview(payload: Object): Investment!
  confirmInvestment(payload: Object): Investment!
  deleteInvestment(_id: String!): Boolean
  addInvestmentDoc(investment_id: String!, doc: Upload!, isK1: Boolean): String
  rmInvestmentDoc(investment_id: String!, file: String!): Boolean
  createCapPDF(data: Object): Investment
  sendWireReminders(investment_ids: [String], deal_id: String): Boolean
  updateInvestmentUserId(investment_user_id: Object, new_user_id: Object): Object 
}

`);
