const { ObjectId } = require("mongodb");
const { pick, omit } = require("lodash");
const Entities = require("../schema/entities");

const Schema = Entities;

const Entity = {};

const Queries = {
  getEntities: async (_, __, { user, db }) => {
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

    const { insertedId } = await db.entities.insertOne({
      ...data,
      accountId: ObjectId(payload.accountId),
      user: ObjectId(user._id),
    });

    const createdEntity = await db.entities.findOne({
      _id: ObjectId(insertedId),
    });
    return createdEntity;
  },
  deleteEntity: async (_, { entityId, accountId }, { db }) => {
    const res = await db.entities.deleteOne({
      _id: ObjectId(entityId),
      accountId: ObjectId(accountId),
    });
    return res.deletedCount === 1;
  },
  updateEntity: async (_, { payload }, { db }) => {
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
