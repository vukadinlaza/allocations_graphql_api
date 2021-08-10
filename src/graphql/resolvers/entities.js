const { ObjectId } = require("mongodb");
const { pick, omit } = require("lodash");
const Entities = require("../schema/entities");

const Schema = Entities;

const Entity = {};

const Queries = {
  getEntity: async (_, { _id }, { user, db }) => {},
  getEntities: async (_, { accountId }, { user, db }) => {
    const account = await db.accounts.findOne({ _id: ObjectId(user.account) });
    const entities = await db.entities
      .find({
        $or: [
          { user: { $in: [...(account.users || []).map((u) => ObjectId(u))] } },
          { user: ObjectId(account.rootAdmin) },
        ],
      })
      .toArray();
    return entities;
  },
};

const Mutations = {
  createEntity: async (_, { payload }, { user, db }) => {
    console.log("FIRES", payload);
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
    const data = pick(payload, options);

    const createdEntity = await db.entities.insertOne({
      ...data,
      accountId: ObjectId(payload.accountId),
      user: ObjectId(user._id),
    });
    return createdEntity.ops[0];
  },
  deleteEntity: async (_, { entityId, accountId }, { user, db }) => {
    const res = await db.entities.deleteOne({
      _id: ObjectId(entityId),
      accountId: ObjectId(accountId),
    });
    return res.deletedCount === 1;
  },
  updateEntity: async (_, { payload }, { user, db }) => {
    return await db.entities.updateOne(
      { _id: ObjectId(payload._id) },
      { $set: { ...omit(payload, "_id") } },
      { new: true }
    );
  },
};

module.exports = {
  Schema,
  Queries,
  Mutations,
  subResolvers: { Entity },
};
