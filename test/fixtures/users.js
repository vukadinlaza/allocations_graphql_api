const { ObjectId } = require("mongodb");
const { ORGANIZATION_ID } = require("./organizations");

const ADMIN_USER_ID = "6114219cff2f4309f664ee04";
const FUND_ADMIN_USER_ID = "61142198824e2509714fd54e";
const INVESTOR_USER_ID = "611421d64bf8d10b94e61606";
const LOGGED_IN_USER_ID = "61142198824e2509714fd54a";

const superAdmin = {
  _id: ObjectId(ADMIN_USER_ID),
  first_name: "Will",
  last_name: "Sheehan",
  email: "superadmin@allocations.com",
  organizations_admin: [ObjectId(ORGANIZATION_ID)],
  admin: true,
};

const fundAdmin = {
  _id: ObjectId(FUND_ADMIN_USER_ID),
  first_name: "Warren",
  last_name: "Buffett",
  email: "fundadmin@allocations.com",
  organizations_admin: [ObjectId(ORGANIZATION_ID)],
};

const investor = {
  _id: ObjectId(INVESTOR_USER_ID),
  first_name: "Han",
  last_name: "Solo",
  email: "investor@allocations.com",
  organizations: [ObjectId(ORGANIZATION_ID)],
};

const altInvestor = {
  _id: ObjectId(LOGGED_IN_USER_ID),
  first_name: "Luke",
  last_name: "Skywalker",
  email: "altinvestor@allocations.com",
  organizations: [],
};

module.exports = {
  ADMIN_USER_ID,
  FUND_ADMIN_USER_ID,
  INVESTOR_USER_ID,
  LOGGED_IN_USER_ID,
  fixtures: [superAdmin, fundAdmin, investor, altInvestor],
};
