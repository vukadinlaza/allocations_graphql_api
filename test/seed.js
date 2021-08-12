const {
  fixtures: organizationFixtures,
  ...organizationIds
} = require("./fixtures/organizations");
const { fixtures: userFixtures, ...userIds } = require("./fixtures/users");
const { fixtures: dealFixtures, ...dealIds } = require("./fixtures/deals");
const {
  fixtures: investmentFixtures,
  ...investmentIds
} = require("./fixtures/investments");

const seed = async (db) => {
  await db.organizations.insertMany(organizationFixtures);
  await db.users.insertMany(userFixtures);
  await db.deals.insertMany(dealFixtures);
  await db.investments.insertMany(investmentFixtures);
};

module.exports = {
  ...userIds,
  ...organizationIds,
  ...dealIds,
  ...investmentIds,
  seed,
};
