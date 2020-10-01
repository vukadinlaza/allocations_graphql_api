const { gql } = require('apollo-server-express')

module.exports = gql(`
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
  investments: [Investment]
  emailInvites: [EmailInvite]
  invitedInvestors: [User]
  allInvited: Boolean
  inviteKey: String
  memo: String
  pledges: [PubPledge]
  documents: [Document]
  appLink: String
  publicLink: String
  dealParams: DealParams
  last_valuation: String
  no_exchange: Boolean
  raised: Int
}

type DealParams {
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
}

input DealParamsInput {
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
}

type PubPledge {
  amount: Int
  timestamp: String
  initials: String
}

type EmailInvite {
  status: String
  sent_at: Float
  to: String
  opened: Boolean
  opened_at: Float
}

enum DealStatus {
  onboarding
  closing
  closed
}

type Query {
  deal(_id: String): Deal
  allDeals: [Deal]
  publicDeal(deal_slug: String!, fund_slug: String!, invite_code: String): Deal
  searchDeals(q: String!, limit: Int): [Deal]
  searchDealsByOrg(q: String!, org: String!, limit: Int): [Deal]
}

type Mutation {
  updateDeal(org: String!, deal: DealInput!): Deal
  createDeal(org: String!, deal: DealInput!): Deal
  deleteDeal(_id: String!): Boolean
  createOrgAndDeal(orgName: String!, deal: DealInput!): Deal
  inviteNewUser(org: String!, deal_id: String!, email: String!): EmailInvite
  inviteInvestor(org: String!, user_id: String!, deal_id: String!): Deal
  uninviteInvestor(org: String!, user_id: String!, deal_id: String!): Deal
  addDealDoc(deal_id: String!, title: String!, doc: Upload!): Deal
  rmDealDoc(deal_id: String!, title: String!): Deal
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
  wireDoc: Upload
  memo: String
  amount: Int
  target: String
  amount_raised: String
  dealParams: DealParamsInput
  last_valuation: String
  no_exchange: Boolean
}
`)
