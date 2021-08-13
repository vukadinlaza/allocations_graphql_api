const { ObjectId } = require("mongodb");

const ORGANIZATION_ID = "61119f11beeab561a48939d3";
const FUN_ORGANIZATION_ID = "6116c82c6efd9ef8f4311e59";

const coolOrganization = {
  _id: ObjectId(ORGANIZATION_ID),
  name: "Cool Fund",
  slug: "cool-fund",
};

const funOrganization = {
  _id: ObjectId(FUN_ORGANIZATION_ID),
  name: "Fun Organization",
  slug: "fun-organization",
};

module.exports = {
  ORGANIZATION_ID,
  FUN_ORGANIZATION_ID,
  fixtures: [coolOrganization, funOrganization],
};
