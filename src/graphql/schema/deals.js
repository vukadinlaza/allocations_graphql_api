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
  deal_name: Int
  deal_lead: String
  pledge_link: String
  onboarding_link: String
  wireInstructions: String
  embed_code: String
  status: String
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
  raised: Float
  airtableId: String
  docSpringTemplateId: String
  spvAgreementKey: String
  dealCoverImageKey: String
  isDemo: Boolean
  viewedUsers: [User]
  dealOnboarding: dealOnboarding
  AUM: Float
  slack_deal: Boolean
  sector: String
  allocation_advisor: Boolean
  allocations_reporting_adviser: Boolean
  reporting_adviser: String
  phases: [Phase]
  metadata: Object
  manager_name: String
  manager: Manager
  name: String
  wire_deadline: String
  phase: String
  virtual_account_number: String
  type: String
  gp_entity_name: String
  need_gp_entity: String
  number_of_investments: Int
  type_of_investors: String
  investor_countries: String
  representative: String
  target_raise_goal: Int
  accept_crypto: Boolean
  accept_ach: Boolean
  dealDetails: [DealDetail]
  portfolio_company_securities: String
  public_pitch_deck: Boolean
  sectors: [String]
  closing_date: String
  portfolio_company_name: String
  master_series: String
  hubspot_deal_id: Int
  subscription_agreement: SubscriptionAgreement
  crypto_wallet_address: String
  version: String!
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
  managementFees: Object
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
  is3c7: Boolean
  customCurrency: String
}

type Phase {
  _id: String
  name: String
  deal_id: String
  tasks: [Task]

}

type Task {
  _id: String
  title: String
  description: String
  type: String
  complete: Boolean
  done_by: String
  metadata: Object
  created_at: String
  updated_at: String
}

type Manager {
  type: String
  name: String
  email: String
  title: String
  entity_name: String
}

type DealDetail {
  title: String
  content: String
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

type DataRequest {
  id: String
  token_id: String
  token_secret: String
  link: String
}

type Message {
  message: String
}

type DataRequestToken {
  id: String
  token_id: String
  token_secret: String
  data_request_url: String
  task: Task  
}

type CreateDealResponse {
  deal: Deal
  documents: [DataRequestToken]
  phases: [Phase]
}

type SubscriptionAgreement { 
  investor_docspring_template_id: String
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
  is3c7: Boolean
}

input DealDetailInput {
  title: String
  content: String
}

input SubscriptionAgreementInput { 
  investor_docspring_template_id: String
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
  dealDetails: [DealDetailInput]
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
  virtual_account_number: String
  subscription_agreement: SubscriptionAgreementInput
}

type Query {
  deal(_id: String, deal_slug: String, fund_slug: String): Deal
  deals(query: Object, org_id: String): [Deal]
  dealsById(dealIds: [String]): [Deal]
  searchDeals(fields: [String]!, searchTerm: String): [Deal]
  publicDeal(deal_slug: String!, fund_slug: String!, invite_code: String): Deal
  fundAdminHighlights: Object
  fundAdminTables(filter: Object, pagination: PaginationInput!): DealPagination

  getCryptoWalletAddress(deal_id: String): String
}

type Mutation {
  createDeal(org: String!, deal: DealInput!): Deal
  updateDeal(org: String!, deal: DealInput!): Deal
  deleteDeal(_id: String!): Boolean
  addDealDoc(deal_id: String!, title: String!, doc: Upload!): Deal
  addDealLogo(deal_id: String!, title: String!, logo: Upload!): Deal
  rmDealLogo(deal_id: String!): Deal
  rmDealDoc(deal_id: String!, title: String!): Deal
  addUserAsViewed(deal_id: String!, user_id: String!): Deal 
  deleteUserAsViewed(deal_id: String!, user_id: String!): Deal 
}
`);
