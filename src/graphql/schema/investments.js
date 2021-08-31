const { gql } = require("apollo-server-express");

module.exports = gql(`
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

enum InvestmentStatus {
  invited
  onboarded
  complete
  signed
  wired
  pledged
}

type InvestmentPagination {
  count: Int
  investments: [Investment]
}

extend type Query {
  investment(_id: String): Investment
  investmentsList(pagination: PaginationInput!): InvestmentPagination
}

extend type Mutation {
  createInvestment(investment: InvestmentInput!): Investment!
  updateInvestment(investment: InvestmentInput!): Investment!
  getInvestmentPreview(payload: Object): Investment!
  confirmInvestment(payload: Object): Investment!
  deleteInvestment(_id: String!): Boolean
  cancelCommitment(_id: String!, reason: String!): Boolean

  addInvestmentDoc(investment_id: String!, doc: Upload!, isK1: Boolean): String
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
  capitalWiredAmount: Float
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
`);
