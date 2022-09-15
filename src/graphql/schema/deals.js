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
  embed_code: String
  status: String
  amount: Int
  target: String
  amount_raised: String
  investment: Investment
  investments: [Investment]
  memo: String
  documents: [Document]
  last_valuation: String
  no_exchange: Boolean
  raised: Float
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
  
  wireInstructions: String @deprecated(reason: "In the process of adopting snake_cased version")
  investmentType: String @deprecated(reason: "In the process of adopting snake_cased version")
  differentPortfolioTerms: Boolean @deprecated(reason: "In the process of adopting snake_cased version")
  allInvited: Boolean @deprecated(reason: "In the process of adopting snake_cased version")
  inviteKey: String @deprecated(reason: "In the process of adopting snake_cased version")
  appLink: String @deprecated(reason: "In the process of adopting snake_cased version")
  publicLink: String @deprecated(reason: "In the process of adopting snake_cased version")
  dealParams: DealParams @deprecated(reason: "In the process of adopting snake_cased version")
  airtableId: String @deprecated(reason: "In the process of adopting snake_cased version")
  docSpringTemplateId: String @deprecated(reason: "In the process of adopting snake_cased version")
  spvAgreementKey: String @deprecated(reason: "In the process of adopting snake_cased version")
  dealCoverImageKey: String @deprecated(reason: "In the process of adopting snake_cased version")
  isDemo: Boolean @deprecated(reason: "In the process of adopting snake_cased version")
  viewedUsers: [User] @deprecated(reason: "In the process of adopting snake_cased version")
  dealOnboarding: dealOnboarding @deprecated(reason: "In the process of adopting snake_cased version")
  dealDetails: [DealDetail] @deprecated(reason: "In the process of adopting snake_cased version")

  #SNAKE-CASED
  wire_instructions: String
  investment_type: String
  different_portfolio_terms: Boolean
  all_invited: Boolean
  invite_key: String
  app_link: String
  public_link: String
  deal_params: DealParams
  airtable_id: String
  docspring_template_id: String
  spv_agreement_key: String
  deal_cover_image_key: String
  is_demo: Boolean
  viewed_users: [User]
  deal_onboarding: dealOnboarding
  deal_details: [DealDetail]
}

type DealParams {
  coinvestors: [String]
  risks: [String]
  valuation: String
  allocation: String
  is3c7: Boolean

  keyHighlights: [String] @deprecated(reason: "In the process of adopting snake_cased version")
  termsAndConditions: [String] @deprecated(reason: "In the process of adopting snake_cased version")
  runRate: String @deprecated(reason: "In the process of adopting snake_cased version")
  dealType: String @deprecated(reason: "In the process of adopting snake_cased version")
  dealMultiple: String @deprecated(reason: "In the process of adopting snake_cased version")
  totalRoundSize: String @deprecated(reason: "In the process of adopting snake_cased version")
  totalCarry: String @deprecated(reason: "In the process of adopting snake_cased version")
  totalManagementFee: String @deprecated(reason: "In the process of adopting snake_cased version")
  maximumInvestment: String @deprecated(reason: "In the process of adopting snake_cased version")
  minimumInvestment: String @deprecated(reason: "In the process of adopting snake_cased version")
  signDeadline: String @deprecated(reason: "In the process of adopting snake_cased version")
  wireDeadline: String @deprecated(reason: "In the process of adopting snake_cased version")
  estimatedSetupCosts: String @deprecated(reason: "In the process of adopting snake_cased version")
  estimatedSetupCostsDollar: String @deprecated(reason: "In the process of adopting snake_cased version")
  estimatedTerm: String @deprecated(reason: "In the process of adopting snake_cased version")
  managementFees: Object @deprecated(reason: "In the process of adopting snake_cased version")
  managementFeesDollar: String @deprecated(reason: "In the process of adopting snake_cased version")
  managementFeeType: String @deprecated(reason: "In the process of adopting snake_cased version")
  portfolioTotalCarry: String @deprecated(reason: "In the process of adopting snake_cased version")
  portfolioEstimatedSetupCosts: String @deprecated(reason: "In the process of adopting snake_cased version")
  portfolioEstimatedSetupCostsDollar: String @deprecated(reason: "In the process of adopting snake_cased version")
  portfolioManagementFees: String @deprecated(reason: "In the process of adopting snake_cased version")
  portfolioManagementFeesDollar: String @deprecated(reason: "In the process of adopting snake_cased version")
  portfolioManagementFeeType: String @deprecated(reason: "In the process of adopting snake_cased version")
  fundTotalCarry: String @deprecated(reason: "In the process of adopting snake_cased version")
  fundEstimatedSetupCosts: String @deprecated(reason: "In the process of adopting snake_cased version")
  fundEstimatedSetupCostsDollar: String @deprecated(reason: "In the process of adopting snake_cased version")
  fundManagementFees: String @deprecated(reason: "In the process of adopting snake_cased version")
  fundManagementFeesDollar: String @deprecated(reason: "In the process of adopting snake_cased version")
  fundManagementFeeType: String @deprecated(reason: "In the process of adopting snake_cased version")
  fundGeneralPartner: String @deprecated(reason: "In the process of adopting snake_cased version")
  fundEstimatedTerm: String @deprecated(reason: "In the process of adopting snake_cased version")
  customCurrency: String @deprecated(reason: "In the process of adopting snake_cased version")

  #SNAKE-CASED
  key_highlights: [String]
  terms_and_conditions: [String]
  run_rate: String
  deal_type: String
  deal_multiple: String
  total_round_size: String
  total_carry: String
  total_management_fee: String
  maximum_investment: String
  minimum_investment: String
  sign_deadline: String
  wire_deadline: String
  estimated_setup_costs: String
  estimated_setup_costs_dollar: String
  estimated_term: String
  management_fees: Object
  management_fees_dollar: String
  management_fee_type: String
  portfolio_total_carry: String
  portfolio_estimated_setup_costs: String
  portfolio_estimated_setup_costs_dollar: String
  portfolio_management_fees: String
  portfolio_management_fees_dollar: String
  portfolio_management_fee_type: String
  fund_total_carry: String
  fund_estimated_setup_costs: String
  fund_estimated_setup_costs_dollar: String
  fund_management_fees: String
  fund_management_fees_dollar: String
  fund_management_fee_type: String
  fund_general_partner: String
  fund_estimated_term: String
  custom_currency: String
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

  psDealId: String @deprecated(reason: "In the process of adopting snake_cased version")
  dealName: String @deprecated(reason: "In the process of adopting snake_cased version")
  dealCreatedDate: String @deprecated(reason: "In the process of adopting snake_cased version")
  dealUpdatedDate: String @deprecated(reason: "In the process of adopting snake_cased version")
  dealUpdatedBy: String @deprecated(reason: "In the process of adopting snake_cased version")
  psTemplate: String @deprecated(reason: "In the process of adopting snake_cased version")
  dealTasks: [dealTask] @deprecated(reason: "In the process of adopting snake_cased version")

#SNAKE-CASED
  ps_deal_id: String
  deal_name: String
  deal_created_date: String
  deal_updated_date: String
  deal_updated_by: String
  ps_template: String
  deal_tasks: [dealTask]
}

type dealTask {
  taskId: String
  taskName: String
  formFields: Object
  taskStatus: String
  taskUpdatedBy: String
  taskUpdatedDate: String

  task_id: String
  task_name: String
  form_fields: Object
  task_status: String
  task_updated_by: String
  task_updated_date: String
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
  allocation: String
  is3c7: Boolean

  #DEPRECATED 
  dealType: String
  dealMultiple: String
  totalRoundSize: String
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

#SNAKE-CASED
  deal_type: String
  deal_multiple: String
  total_round_size: String
  total_carry: String
  total_management_fee: String
  minimum_investment: String
  sign_deadline: String
  wire_deadline: String
  estimated_setup_costs: String
  estimated_setup_costs_dollar: String
  estimated_term: String
  management_fees: String
  management_fees_dollar: String
  management_fee_type: String
  portfolio_total_carry: String
  portfolio_estimated_setup_costs: String
  portfolio_estimated_setup_costs_dollar: String
  portfolio_management_fees: String
  portfolio_management_fees_dollar: String
  portfolio_management_fee_type: String
  fund_total_carry: String
  fund_estimated_setup_costs: String
  fund_estimated_setup_costs_dollar: String
  fund_management_fees: String
  fund_management_fees_dollar: String
  fund_management_fee_type: String
  fund_general_partner: String
  fund_estimated_term: String
  deal_logo: String
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
  memo: String
  amount: Int
  target: String
  amount_raised: String
  last_valuation: String
  no_exchange: Boolean
  virtual_account_number: String
  subscription_agreement: SubscriptionAgreementInput
  slug: String
  
  #DEPRECATED
  allInvited: Boolean
  differentPortfolioTerms: Boolean
  wireDoc: Upload
  investmentType: String
  dealDetails: [DealDetailInput]
  dealParams: DealParamsInput
  airtableId: String
  docSpringTemplateId: String
  spvAgreementKey: String
  isPostingComment: Boolean

  #SNAKE-CASED
  all_invited: Boolean
  different_portfolio_terms: Boolean
  wire_doc: Upload
  deal_details: [DealDetailInput]
  investment_type: String
  deal_params: DealParamsInput
  airtable_id: String
  docspring_template_id: String
  spv_agreement_key: String
  is_posting_comment: Boolean
}

type Query {
  deal(_id: String, deal_slug: String, fund_slug: String): Deal
  deals(query: Object, org_id: String): [Deal]
  dealsById(dealIds: [String]): [Deal]
  searchDeals(fields: [String]!, searchTerm: String): [Deal]
  publicDeal(deal_slug: String!, fund_slug: String!, invite_code: String): Deal
  fundAdminHighlights: Object
  fundAdminTables(filter: Object, pagination: PaginationInput!): DealPagination

  getCryptoWalletAddress(deal_id: String): String  @deprecated(reason: "In the process of adopting snake_cased version")
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
