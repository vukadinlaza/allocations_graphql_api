const { ObjectId } = require("mongodb");
const { FUND_DEAL_ID, SPV_DEAL_ID } = require("./deals");

const WIRED_INVESTMENT_ID = "6111bb42a4991d5a547352b6";
const PENDING_INVESTMENT_ID = "6111bbe6ad565e63b254d0df";
const WIRED_SPV_INVESTMENT_ID = "61143bc4aa6f42619d924309";

const wiredFundInvestment = {
  _id: ObjectId(WIRED_INVESTMENT_ID),
  status: "wired",
  amount: 25000,
  deal_id: ObjectId(FUND_DEAL_ID),
  user_id: ObjectId("611421d64bf8d10b94e61606"),
};

const pendingFundInvestment = {
  _id: ObjectId(PENDING_INVESTMENT_ID),
  status: "pending",
  amount: 10000,
  deal_id: ObjectId(FUND_DEAL_ID),
  user_id: ObjectId("611421d64bf8d10b94e61606"),
};

const wiredSPVInvestment = {
  _id: ObjectId(WIRED_SPV_INVESTMENT_ID),
  status: "wired",
  amount: 5000,
  deal_id: ObjectId(SPV_DEAL_ID),
  user_id: ObjectId("611421d64bf8d10b94e61606"),
};

module.exports = {
  WIRED_INVESTMENT_ID,
  PENDING_INVESTMENT_ID,
  WIRED_SPV_INVESTMENT_ID,
  fixtures: [wiredFundInvestment, pendingFundInvestment, wiredSPVInvestment],
};
