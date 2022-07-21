const { ObjectId } = require("mongodb");
const { isAdmin } = require("../../permissions");
const { customInvestmentPagination } = require("../../pagHelpers");
const { throwApolloError } = require("../../../utils/common");
const { fetchInvest } = require("../../../utils/invest");

const Queries = {
  investment: (_, args, ctx) => {
    return ctx.datasources.investments.getInvestmentById({
      investment_id: ObjectId(args._id),
    });
  },
  investments: (_, args, ctx) => {
    isAdmin(ctx);
    return ctx.collection("investments").find(args?.query || {});
  },
  investmentsList: async (_, args, ctx) => {
    isAdmin(ctx);
    const { pagination, currentPage } = args.pagination;
    const documentsToSkip = pagination * currentPage;
    const aggregation = customInvestmentPagination(args.pagination);
    const countAggregation = [...aggregation, { $count: "count" }];

    const investmentsCount = await ctx.db
      .collection("investments")
      .aggregate(countAggregation)
      .toArray();
    const count = investmentsCount.length ? investmentsCount[0].count : 0;

    let investments = await ctx.db
      .collection("investments")
      .aggregate(aggregation)
      .skip(documentsToSkip)
      .limit(pagination)
      .toArray();
    return { count, investments };
  },

  newInvestment: async (_, args, ctx) => {
    try {
      isAdmin(ctx);
      const investment = await fetchInvest(`/api/v1/investments/${args._id}`);
      return investment;
    } catch (e) {
      throwApolloError(e, "newInvestment");
    }
  },
};

module.exports = Queries;
