const { ObjectId } = require("mongodb");
const { isAdmin, isOrgAdmin } = require("../../permissions");
const { customUserPagination } = require("../../pagHelpers");

const Queries = {
  /** admin or investor themselves can query **/
  user: async (_, args, ctx) => {
    const query = args._id
      ? { _id: ObjectId(args._id) }
      : { email: ctx.user.email };

    return ctx.db.collection("users").findOne(query);
  },
  users: (_, { org_id, query }, ctx) => {
    query ? isOrgAdmin(org_id, ctx) : isAdmin(ctx);

    return ctx.db
      .collection("users")
      .find(query || {})
      .toArray();
  },
  usersById: (_, { userIds }, ctx) => {
    isAdmin(ctx);

    const objectIds = userIds.map((id) => ObjectId(id));
    return ctx.db
      .collection("users")
      .find({ _id: { $in: objectIds } })
      .toArray();
  },
  searchUsers: async (_, { fields, searchTerm }, ctx) => {
    isAdmin(ctx);
    const orQuery = fields.map((field) => ({
      [field]: { $regex: searchTerm, $options: "i" },
    }));
    const users = await ctx.db
      .collection("users")
      .find({ $or: orQuery })
      .toArray();

    return users;
  },

  // AGGREGATION - to review later
  allUsers: async (_, args, ctx) => {
    isAdmin(ctx);
    const { pagination, currentPage } = args.pagination;
    const documentsToSkip = pagination * currentPage;
    const aggregation = customUserPagination(
      args.pagination,
      args.additionalFilter
    );
    const countAggregation = [...aggregation, { $count: "count" }];
    const usersCount = await ctx.db
      .collection("users")
      .aggregate(countAggregation)
      .toArray();
    const count = usersCount.length ? usersCount[0].count : 0;

    let users = await ctx.db
      .collection("users")
      .aggregate(aggregation)
      .skip(documentsToSkip)
      .limit(pagination)
      .toArray();

    users = users.map((item) => item.user);
    return { count, users };
  },
  //TO BE DELETED
  investor: async (_, args, ctx) => {
    const query = args._id
      ? { _id: ObjectId(args._id) }
      : { email: ctx.user.email };

    return ctx.db.collection("users").findOne(query);
  },
  investorsLookupById: (_, { userIds }, ctx) => {
    isAdmin(ctx);

    const objectIds = userIds.map((id) => ObjectId(id));
    return ctx.db
      .collection("users")
      .find({ _id: { $in: objectIds } })
      .toArray();
  },
  searchUsersByEmail: async (_, { q }, ctx) => {
    const userOne = q[0];
    const userTwo = q[1];

    const searchQ = {
      $or: [
        { email: { $regex: userOne, $options: "i" } },
        { email: { $regex: userTwo, $options: "i" } },
      ],
    };

    const users = await ctx.db
      .collection("users")
      .find({
        ...searchQ,
      })
      .toArray();

    return users;
  },
};

module.exports = Queries;
