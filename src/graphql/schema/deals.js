const { gql } = require("apollo-server-express");

module.exports = gql(`
scalar Upload

type Deal {
  _id: String
  created_at: String
  updated_at: String
  approved: Boolean
  organization: Organization
  company_name: String
  slug: String
  company_description: String
  investment_documents: String
  date_closed: String
  deal_lead: String
  pledge_link: String
  onboarding_link: String
  wireInstructions: String
  embed_code: String
  status: DealStatus
  amount: Int
  target: String
  amount_raised: String
  investment: Investment
  investmentType: String
  differentPortfolioTerms: Boolean
  investments: [Investment]
  allInvited: Boolean
  inviteKey: String
  memo: String
  documents: [Document]
  appLink: String
  publicLink: String
  dealParams: DealParams
  last_valuation: String
  no_exchange: Boolean
  raised: Int
  airtableId: String
  docSpringTemplateId: String
  spvAgreementKey: String
  dealCoverImageKey: String
  isDemo: Boolean
  viewedUsers: [User]
  dealOnboarding: dealOnboarding
  AUM: Int
  slack_deal: Boolean
  sector: String
  allocation_advisor: Boolean
}

type DealParams {
  coinvestors: [String]
  risks: [String]
  keyHighlights: [String]
  termsAndConditions: [String]
  valuation: String
  runRate: String
  dealType: String
  dealMultiple: String
  totalRoundSize: String
  allocation: String
  totalCarry: String
  totalManagementFee: String
  maximumInvestment: String
  minimumInvestment: String
  signDeadline: String
  wireDeadline: String
  estimatedSetupCosts: String
  estimatedSetupCostsDollar: String
  estimatedTerm: String
  managementFees: String
  managementFeesDollar: String
  managementFeeType: String
  portfolioTotalCarry: String
  portfolioEstimatedSetupCosts: String
  portfolioEstimatedSetupCostsDollar: String
  portfolioManagementFees: String
  portfolioManagementFeesDollar: String
  portfolioManagementFeeType: String
  fundTotalCarry: String
  fundEstimatedSetupCosts: String
  fundEstimatedSetupCostsDollar: String
  fundManagementFees: String
  fundManagementFeesDollar: String
  fundManagementFeeType: String
  fundGeneralPartner: String
  fundEstimatedTerm: String
}

input DealParamsInput {
  coinvestors: [String]
  risks: [String]
  dealType: String
  dealMultiple: String
  totalRoundSize: String
  allocation: String
  totalCarry: String
  totalManagementFee: String
  minimumInvestment: String
  signDeadline: String
  wireDeadline: String
  estimatedSetupCosts: String
  estimatedSetupCostsDollar: String
  estimatedTerm: String
  managementFees: String
  managementFeesDollar: String
  managementFeeType: String
  portfolioTotalCarry: String
  portfolioEstimatedSetupCosts: String
  portfolioEstimatedSetupCostsDollar: String
  portfolioManagementFees: String
  portfolioManagementFeesDollar: String
  portfolioManagementFeeType: String
  fundTotalCarry: String
  fundEstimatedSetupCosts: String
  fundEstimatedSetupCostsDollar: String
  fundManagementFees: String
  fundManagementFeesDollar: String
  fundManagementFeeType: String
  fundGeneralPartner: String
  fundEstimatedTerm: String
  dealLogo: String
}

type dealOnboarding {
  _id: String
  psDealId: String
  dealName: String
  dealCreatedDate: String
  dealUpdatedDate: String
  dealUpdatedBy: String
  psTemplate: String
  dealTasks: [dealTask]
}

type dealTask {
  taskId: String
  taskName: String
  formFields: Object
  taskStatus: String
  taskUpdatedBy: String
  taskUpdatedDate: String
}

type DealPagination {
  count: Int
  deals: [Deal]
}

enum DealStatus {
  onboarding
  closing
  closed
  draft
}

type Query {
  deal(_id: String, deal_slug: String, fund_slug: String): Deal
  allDeals: [Deal]
  publicDeal(deal_slug: String!, fund_slug: String!, invite_code: String): Deal
  searchDeals(q: String!, limit: Int): [Deal]
  searchDealsByOrg(q: String!, org: String!, limit: Int): [Deal]
  fundAdminHighlights: Object
  fundAdminTables(filter: Object, pagination: PaginationInput!): DealPagination
}

type Mutation {
  updateDeal(org: String!, deal: DealInput!): Deal
  createDeal(org: String!, deal: DealInput!): Deal
  deleteDeal(_id: String!): Boolean
  createOrgAndDeal(orgName: String!, deal: DealInput!): Deal
  addDealDoc(deal_id: String!, title: String!, doc: Upload!): Deal
  addDealLogo(deal_id: String!, title: String!, logo: Upload!): Deal
  rmDealLogo(deal_id: String!): Deal
  rmDealDoc(deal_id: String!, title: String!): Deal
  addDealDocs(deal_id: String!, docs: Upload): Deal
  addUserAsViewed(deal_id: String!, user_id: String!): Deal 
  deleteUserAsViewed(deal_id: String!, user_id: String!): Deal 
}

type Subscription {
  dealOnboarding(data: String): Object
}


input DealInput {
  _id: String
  company_name: String
  company_description: String
  date_closed: String
  deal_lead: String
  pledge_link: String
  onboarding_link: String
  embed_code: String
  status: String
  closed: Boolean
  allInvited: Boolean
  differentPortfolioTerms: Boolean
  wireDoc: Upload
  memo: String
  amount: Int
  target: String
  amount_raised: String
  investmentType: String
  dealParams: DealParamsInput
  last_valuation: String
  no_exchange: Boolean
  airtableId: String
  docSpringTemplateId: String
  spvAgreementKey: String
  isPostingComment: Boolean
}
`);
