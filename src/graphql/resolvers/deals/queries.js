const { ObjectId } = require("mongodb");
const { AuthenticationError } = require("apollo-server-express");
const { isAdmin, isOrgAdmin } = require("../../permissions");
const { customDealPagination } = require("../../pagHelpers");
const { getHighlights } = require("../../mongoHelpers.js");
const { CryptoService } = require("@allocations/crypto-service");

const Queries = {
  deal: async (_, args, ctx) => {
    const org = await ctx.db.organizations.findOne({ slug: args.fund_slug });

    if (org !== null && args.deal_slug) {
      const result = await ctx.datasources.deals.getDealByOrgIdAndDealslug({
        deal_slug: args.deal_slug,
        fund_id: ObjectId(org._id),
      });
      return result;
    }
    return ctx.datasources.deals.getDealById({ deal_id: ObjectId(args._id) });
  },
  deals: (_, { org_id, query }, ctx) => {
    query ? isOrgAdmin(org_id, ctx) : isAdmin(ctx);

    return ctx.db
      .collection("deals")
      .find(query || {})
      .toArray();
  },
  dealsById: (_, { dealIds }, ctx) => {
    isAdmin(ctx);

    const objectIds = dealIds.map((id) => ObjectId(id));
    return ctx.db
      .collection("deals")
      .find({ _id: { $in: objectIds } })
      .toArray();
  },
  searchDeals: async (_, { fields, searchTerm }, ctx) => {
    isAdmin(ctx);
    const orQuery = fields.map((field) => ({
      [field]: { $regex: searchTerm, $options: "i" },
    }));
    const deals = await ctx.db
      .collection("deals")
      .find({ $or: orQuery })
      .toArray();

    return deals;
  },
  /** Public Deal fetches the deal info WITHOUT auth **/
  publicDeal: async (_, { deal_slug, fund_slug }, { db, datasources }) => {
    const fund = await db.organizations.findOne({ slug: fund_slug });
    const deal = await datasources.deals.getDealByOrgIdAndDealslug({
      deal_slug: deal_slug,
      fund_id: fund._id,
    });

    if (deal) return deal;

    throw new AuthenticationError("permission denied");
  },
  /** gets fund admin highlights tab data **/
  fundAdminHighlights: async (_, args, { db }) => {
    const highlights = await db.deals.aggregate(getHighlights()).toArray();
    return highlights[0];
  },
  /** Gets fund admin Funds/SPVs tabs data**/
  fundAdminTables: async (_, args, ctx) => {
    isAdmin(ctx);
    const { pagination, currentPage } = args.pagination;
    const documentsToSkip = pagination * currentPage;
    const aggregation = customDealPagination(args.pagination, args.filter);
    const countAggregation = [...aggregation, { $count: "count" }];

    const dealsCount = await ctx.db
      .collection("deals")
      .aggregate(countAggregation)
      .toArray();
    const count = dealsCount.length ? dealsCount[0].count : 0;

    let deals = await ctx.db
      .collection("deals")
      .aggregate(aggregation)
      .skip(documentsToSkip)
      .limit(pagination)
      .toArray();

    deals = deals.map((item) => item.deal);

    return { count, deals };
  },
  //TO BE DELETED AUG 4th 2022
  getCryptoWalletAddress: async (_, { deal_id }) => {
    const res = await CryptoService.getWallet(deal_id);
    if (res.acknowledged) {
      return res.wallet.deposit_address;
    }
    throw new Error(res.error);
  },
};

module.exports = Queries;
