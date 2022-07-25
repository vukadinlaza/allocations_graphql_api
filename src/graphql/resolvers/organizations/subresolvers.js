const { isAdmin } = require("../../permissions");

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
    const [{ investments } = {}] = await db.deals
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

    return investments || 0;
  },
  /** members must have the org id on their .organizations_admin key **/
  members: async (organization, _, { user, db }) => {
    isAdmin({ user, db });
    return db.users.find({ organizations_admin: organization._id }).toArray();
  },
};

module.exports = {
  Organization,
};
