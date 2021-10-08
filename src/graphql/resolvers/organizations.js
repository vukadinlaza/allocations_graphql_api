const { ObjectId } = require("mongodb");
const { isAdmin, isOrgAdmin } = require("../permissions");
const PublicUploader = require("../../uploaders/public-docs");
const AdminMailer = require("../../mailers/admin-mailer");
const { AuthenticationError } = require("apollo-server-express");
const Organizations = require("../schema/organizations");
const { customOrgPagination } = require("../pagHelpers");
const { getOrgOverviewData } = require("../mongoHelpers.js");

const Schema = Organizations;

const Queries = {
  organization: async (_, { slug }, { user, db }) => {
    const org = await db.organizations.findOne({ slug });
    // short circuit with fund if superadmin
    if (user.admin) return org;
    if (slug === "demo-fund") return org;
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

const Mutations = {
  /** creates org and adds the creator to the fund automatically  **/
  createOrganization: async (
    _,
    { organization: { logo, ...organization } },
    ctx
  ) => {
    isAdmin(ctx);

    // upload logo
    if (logo) {
      await PublicUploader.upload({
        doc: logo,
        path: `organizations/${organization.slug}.png`,
      });
    }

    const res = await ctx.db.organizations.insertOne({
      ...organization,
      created_at: Date.now(),
    });
    const org = res.ops[0];

    // add user to org admin
    await ctx.db.users.updateOne(
      { _id: ctx.user._id },
      { $push: { organizations_admin: org._id } }
    );
    return org;
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
      { returnOriginal: false }
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
  deals: async (
    org,
    { order_by = "created_at", order_dir = -1, limit, offset, status },
    { db, datasources }
  ) => {
    let activeStatus =
      status === "active"
        ? ["onboarding", "closing"]
        : ["onboarding", "closing", "closed", "draft"];

    if (status === "closed") {
      activeStatus = ["closed"];
    }
    const query = {
      organization: org._id,
      status: { $in: activeStatus },
    };
    // default sort order is descending by created_at
    return await datasources.deals.getAllDeals({ query });
  },
  deal: (org, { _id }, { db, datasources }) => {
    const deal = datasources.deals.getDealById({ deal_id: _id });
    console.log("DEAL RETURNED", deal);
    return deal;
  },
  n_deals: (org, _, { db }) => {
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
  investments: async (org, _, { db }) => {
    const dealQuery =
      org.slug === "allocations"
        ? { organization: { $in: [org._id, null] } }
        : { organization: org._id };

    const deals = await db.collection("deals").find(dealQuery).toArray();
    return db.investments
      .find({ deal_id: { $in: deals.map((d) => d._id) } })
      .toArray();
  },
  adminInvites: (org) => {
    return org.adminInvites || [];
  },
  // since approved was added on later, we're going to assume any previous one IS approved
  approved: (org) => {
    return org.approved !== false;
  },
};

module.exports = {
  Organization,
  Queries,
  Schema,
  Mutations,
  subResolvers: { Organization },
};
