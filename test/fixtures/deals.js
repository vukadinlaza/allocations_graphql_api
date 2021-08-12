const { ObjectId } = require("mongodb");
const { ORGANIZATION_ID } = require("./organizations");
const { INVESTOR_USER_ID } = require("./users");

const FUND_DEAL_ID = "601c54cbe40e5900230f505d";
const SPV_DEAL_ID = "61143ac37db3b3619db1df42";

const fundDeal = {
  _id: ObjectId(FUND_DEAL_ID),
  company_name: "test-deal",
  investmentType: "fund",
  organization: ObjectId(ORGANIZATION_ID),
  status: "onboarding",
  dealParams: { valuation: "100000" },
  slug: "test-deal",
  created_at: Date.now(),
  inviteKey: "3eaf5d8d-0537-4500-84d5-b873e260d85b",
  usersViewed: [ObjectId(INVESTOR_USER_ID)],
};

const spvDeal = {
  _id: ObjectId(SPV_DEAL_ID),
  company_name: "SPV Deal",
  investmentType: "spv",
  organization: ObjectId(ORGANIZATION_ID),
  status: "onboarding",
  dealParams: { valuation: "200000" },
  slug: "spv-deal",
  created_at: Date.now(),
  inviteKey: "3eaf5d8d-0537-4500-84d5-b873e260d85b",
  usersViewed: [ObjectId(INVESTOR_USER_ID)],
};

module.exports = {
  FUND_DEAL_ID,
  SPV_DEAL_ID,
  fixtures: [fundDeal, spvDeal],
};
