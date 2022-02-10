const { ObjectId } = require("mongodb");
const { isAdmin, isOrgAdmin } = require("../permissions");
const PublicUploader = require("../../uploaders/public-docs");
const AdminMailer = require("../../mailers/admin-mailer");
const { AuthenticationError } = require("apollo-server-express");
const Organizations = require("../schema/organizations");
const { customOrgPagination } = require("../pagHelpers");
const { getOrgOverviewData } = require("../mongoHelpers.js");
const { throwApolloError } = require("../../utils/common");

const Schema = Organizations;

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
  orgLastDeals: async (_, { slug, lastNDeals }, ctx) => {
    isAdmin(ctx);
    const org = await ctx.db.organizations.findOne({ slug });
    const orgDeals = await ctx.datasources.deals.getDealsByOrg(org._id);
    const orderedDeals = orgDeals.sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    );
    const spvs = orderedDeals.filter((deal) => deal.type !== "fund");
    const funds = orderedDeals.filter((deal) => deal.type === "fund");
    const slicedSpvs = spvs.length ? spvs.slice(-lastNDeals) : [];
    const slicedFunds = funds.length ? funds.slice(-lastNDeals) : [];
    console.log(
      [...slicedSpvs, ...slicedFunds].map((d) => d.name || d.company_name)
    );
    return {
      slug,
      deals: [...slicedSpvs, ...slicedFunds],
    };
  },
};

const Mutations = {
  /** creates org and adds the creator to the fund automatically  **/
  createOrganization: async (
    _,
    { organization: { logo, ...organization } },
    ctx
  ) => {
    try {
      isAdmin(ctx);

      // upload logo
      if (logo) {
        await PublicUploader.upload({
          doc: logo,
          path: `organizations/${organization.slug}.png`,
        });
      }

      // make slug unique from any other organization
      const slug = `${organization.name.split(" ").join("-")}-${Date.now()}`;

      const { insertedId: _id } = await ctx.db.organizations.insertOne({
        ...organization,
        slug,
        created_at: Date.now(),
      });

      // add user to org admin
      await ctx.db.users.updateOne(
        { _id: ctx.user._id },
        { $push: { organizations_admin: _id } }
      );
      return { ...organization, slug, _id };
    } catch (err) {
      throwApolloError(err, "createOrganization");
    }
  },
  /** simple update **/
  updateOrganization: async (
    _,
    { organization: { _id, slug, ...organization } },
    ctx
  ) => {
    isOrgAdmin(_id, { user: ctx.user });
    const updatedOrg = await ctx.db.organizations.findOneAndUpdate(
      { _id: ObjectId(_id) },
      { $set: { ...organization, slug, updated_at: Date.now() } },
      { returnDocument: "after" }
    );
    return updatedOrg.value;
  },
  /** add member to org **/
  addOrganizationMembership: async (_, { slug, user_id }, ctx) => {
    isAdmin(ctx);
    const { _id } = await ctx.db.organizations.findOne({ slug });
    return ctx.db.users.updateOne(
      { _id: ObjectId(user_id) },
      { $push: { organizations_admin: _id } }
    );
  },
  /** rm member from org **/
  revokeOrganizationMembership: async (_, { slug, user_id }, ctx) => {
    isAdmin(ctx);
    const { _id } = await ctx.db.organizations.findOne({ slug });
    return ctx.db.users.updateOne(
      { _id: ObjectId(user_id) },
      { $pull: { organizations_admin: _id } }
    );
  },
  /** sends invite, mail and db **/
  sendAdminInvite: async (_, { slug, user_id }, ctx) => {
    isAdmin(ctx);

    const org = await ctx.db.organizations.findOne({ slug });
    const { email } = await ctx.db.users.findOne({ _id: ObjectId(user_id) });
    const invite = await AdminMailer.sendInvite({ org, to: email });

    await ctx.db.organizations.updateOne(
      { slug },
      { $push: { adminInvites: invite } }
    );
    return invite;
  },
};

const Organization = {
  deals: async (org, _, { datasources }) => {
    if (org.deals) return org.deals;
    const query = {
      organization: org._id,
    };
    // default sort order is descending by created_at
    return datasources.deals.getAllDeals({ query });
  },
  deal: async (org, { _id }, { datasources }) => {
    const deal = await datasources.deals.getDealById({ deal_id: _id });
    return deal;
  },
  n_deals: (org, _, { datasources }) => {
    if (org.slug === "allocations") {
      return datasources.deals.getAllDeals({
        organization: { $in: [org._id, null] },
      }).length;
    } else {
      return datasources.deals.getAllDeals({ organization: org._id }).length;
    }
  },
  investors: (org, _, { db }) => {
    if (org.slug === "allocations") {
      return db.users.find().toArray();
    } else {
      return db.users.find({ organizations: org._id }).toArray();
    }
  },
  investments: async (org, _, { db, ctx }) => {
    const dealQuery =
      org.slug === "allocations"
        ? { organization: { $in: [org._id, null] } }
        : { organization: org._id };

    const deals = await db.collection("deals").find(dealQuery).toArray();
    return ctx.datasources.investments.getAllInvestments({
      deal_id: { $in: deals.map((d) => d._id) },
    });
  },
  adminInvites: (org) => {
    return org.adminInvites || [];
  },
  // since approved was added on later, we're going to assume any previous one IS approved
  approved: (org) => {
    return org.approved !== false;
  },
  totalAUM: async (org, _, { db }) => {
    if ("totalPrivateFunds" in org) {
      //If organization comes from server paginated aggregation, we won't recalculate the totalAUM
      return parseFloat(org.totalAUM);
    }

    const data = await db.deals
      .aggregate([
        { $match: { organization: org._id } },
        {
          $lookup: {
            from: "investments",
            localField: "_id",
            foreignField: "deal_id",
            as: "investments",
          },
        },
        { $unwind: "$investments" },
        { $match: { "investments.status": { $in: ["complete", "wired"] } } },
        { $project: { amount: { $toInt: "$investments.amount" } } },
        {
          $group: {
            _id: null,
            aum: { $sum: "$amount" },
          },
        },
      ])
      .toArray();

    return data && data.length ? data[0].aum : 0;
  },
  totalSPVs: async (org, _, { db }) => {
    const res = await db.deals
      .aggregate([
        { $match: { organization: org._id, investmentType: { $ne: "fund" } } },
        { $count: "spvs" },
      ])
      .toArray();

    return res[0]?.spvs || 0;
  },
  totalFunds: async (org, _, { db }) => {
    const res = await db.deals
      .aggregate([
        { $match: { organization: org._id, investmentType: "fund" } },
        { $count: "funds" },
      ])
      .toArray();

    return res[0]?.funds || 0;
  },
  totalInvestments: async (org, _, { db }) => {
    const [{ investments }] = await db.deals
      .aggregate([
        { $match: { organization: org._id } },
        {
          $lookup: {
            from: "investments",
            localField: "_id",
            foreignField: "deal_id",
            as: "investments",
          },
        },
        { $unwind: "$investments" },
        {
          $match: {
            "investments.status": { $in: ["signed", "complete", "wired"] },
          },
        },
        { $count: "investments" },
      ])
      .toArray();

    return investments;
  },
};

module.exports = {
  Organization,
  Queries,
  Schema,
  Mutations,
  subResolvers: { Organization },
};
