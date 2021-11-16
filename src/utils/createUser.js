const { ObjectId } = require("mongodb");
const { pick } = require("lodash");

const createUserAccountAndEntity = async ({ db, u }) => {
  const res = await db.accounts.insertOne({ rootAdmin: ObjectId(u._id) });

  const createdAcct = res.ops[0];

  // Create the primary entity for the USER
  const options = [
    "investor_type",
    "country",
    "state",
    "first_name",
    "last_name",
    "entity_name",
    "signer_full_name",
    "accredited_investor_status",
    "email",
    "accountId",
  ];
  const data = pick(u, options);
  await db.entities.insertOne({
    ...data,
    isPrimaryEntity: true,
    accountId: ObjectId(createdAcct._id),
    user: ObjectId(u._id),
  });

  // Add the Account ID to the USER
  return db.users.updateOne(
    { _id: u._id },
    { $set: { account: ObjectId(createdAcct._id) } }
  );
};

module.exports = {
  createUserAccountAndEntity,
};
