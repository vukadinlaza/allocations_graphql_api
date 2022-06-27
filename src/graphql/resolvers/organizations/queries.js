const { ObjectId } = require("mongodb");
const { isAdmin } = require("../../permissions");
const { AuthenticationError } = require("apollo-server-express");
const { customOrgPagination } = require("../../pagHelpers");
const { getOrgOverviewData } = require("../../mongoHelpers.js");

const Queries = {
  organization: async (_, { slug }, { user, db }) => {
    const org = await db.organizations.findOne({ slug });
    // short circuit with fund if superadmin
    if (user.admin) return org;
    if (
      slug === "demo-fund" ||
      user.email === "allocationsdemo@allocations.com"
    )
      return org;
    if (
      org &&
      user &&
      (user.organizations_admin || [])
        .map((id) => id.toString())
        .includes(org._id.toString())
    ) {
      return org;
    }
    throw new AuthenticationError("org query throw");
  },
  organizationById: async (_, { _id }, { user, db }) => {
    const org = await db.organizations.findOne({ _id: ObjectId(_id) });
    // short circuit with fund if superadmin
    if (user.admin) {
      return org;
    }

    if (
      org &&
      user &&
      (user.organizations_admin || [])
        .map((id) => id.toString())
        .includes(org._id.toString())
    ) {
      return org;
    }
    throw new AuthenticationError("org query throw");
  },
  /** members must have the org id on their .organizations_admin key **/
  organizationMembers: async (_, { slug }, { user, db }) => {
    isAdmin({ user, db });
    const org = await db.organizations.findOne({ slug });

    return db.users.find({ organizations_admin: org._id }).toArray();
  },
  // * onyl organizations with investments and deals show up
  pagOrganizations: async (_, args, ctx) => {
    isAdmin(ctx);
    const { pagination, currentPage } = args.pagination;

    const documentsToSkip = pagination * currentPage;
    const aggregation = customOrgPagination(args.pagination);
    const countAggregation = [...aggregation, { $count: "count" }];
    const organizationsCount = await ctx.db
      .collection("organizations")
      .aggregate(countAggregation)
      .toArray();
    const count = organizationsCount.length ? organizationsCount[0].count : 0;

    let organizations = await ctx.db
      .collection("organizations")
      .aggregate(aggregation)
      .skip(documentsToSkip)
      .limit(pagination)
      .toArray();

    return { count, organizations };
  },
  overviewData: async (_, { slug }, { db }) => {
    const aggregation = getOrgOverviewData(slug);
    const data = await db.deals.aggregate(aggregation).toArray();
    return data[0];
  },
};

module.exports = {
  Queries,
};
