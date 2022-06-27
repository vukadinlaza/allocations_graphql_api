const Organizations = require("../../schema/organizations");
const { Queries } = require("./queries");
const { Mutations } = require("./mutations");
const { Organization } = require("./subresolvers");

const Schema = Organizations;

module.exports = {
  Organization,
  Queries,
  Schema,
  Mutations,
  subResolvers: { Organization },
};
