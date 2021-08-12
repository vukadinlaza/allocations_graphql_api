const { ObjectId } = require("mongodb");

const ORGANIZATION_ID = "61119f11beeab561a48939d3";

const coolOrganization = {
  _id: ObjectId(ORGANIZATION_ID),
  name: "Cool Fund",
  slug: "cool-fund",
};

module.exports = {
  ORGANIZATION_ID,
  fixtures: [coolOrganization],
};
