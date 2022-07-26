const { isAdmin, isOrgAdmin } = require("../../permissions");
const { customOrgPagination } = require("../../pagHelpers");
const { getOrgOverviewData } = require("../../mongoHelpers.js");
const { ObjectId } = require("mongodb");
const { default: fetch } = require("node-fetch");
const { requestBuild } = require("../../../utils/build-api");

const Queries = {
  organization: async (_, { slug, _id }, { user, db }) => {
    const query = _id ? { _id: ObjectId(_id) } : { slug };
    const org = await db.organizations.findOne(query);
    const isDemo =
      slug === "demo-fund" || user.email === "allocationsdemo@allocations.com";
    if (isDemo) return org;
    isOrgAdmin(org._id, { user });
    return org;
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
  getSyncedOrgs: async (_, args, ctx) => {
    isAdmin(ctx);

    const res = await fetch(
      `${process.env.BUILD_API_URL}/api/v1/organizations`,
      {
        method: "GET",
        headers: {
          "X-API-TOKEN": process.env.ALLOCATIONS_TOKEN,
          "Content-Type": "application/json",
        },
      }
    );
    const response = await res.json();

    const missmatches = [];
    for (let org of response.reverse()) {
      const orgs = await ctx.db.organizations.findOne({
        _id: ObjectId(org._id),
      });
      if (!orgs) {
        missmatches.push(org);
      }
    }

    const lastTen = missmatches.slice(0, 10);

    for (let serviceOrg of lastTen) {
      const dealsResponse = await requestBuild(
        `/api/v1/organizations/deals?_id=${serviceOrg._id}`
      );
      serviceOrg.deals = dealsResponse.deals;

      const orgByName = await ctx.db.organizations
        .find({
          name: { $regex: serviceOrg.name || "", $options: "i" },
        })
        .toArray();

      const orgBySlug = await ctx.db.organizations
        .find({
          slug: {
            $regex:
              serviceOrg.slug.split("-").slice(0, -1).join("-") ||
              serviceOrg.slug,
            $options: "i",
          },
        })
        .toArray();

      serviceOrg.legacyOrgs = [
        ...orgByName,
        ...orgBySlug.filter(
          (org) =>
            !orgByName.map((o) => o._id.toString()).includes(org._id.toString())
        ),
      ].filter((org) => org);

      for (let legacyOrg of serviceOrg.legacyOrgs) {
        legacyOrg.deals = await ctx.db.deals
          .find({
            organization: legacyOrg._id,
          })
          .toArray();
      }
    }

    return {
      missmatches: missmatches.length,
      lastTen,
    };
  },

  //TO BE DELETED AUG 4th 2022
  organizationMembers: async (_, { slug }, { user, db }) => {
    isAdmin({ user, db });
    const org = await db.organizations.findOne({ slug });

    return db.users.find({ organizations_admin: org._id }).toArray();
  },
};

module.exports = Queries;
