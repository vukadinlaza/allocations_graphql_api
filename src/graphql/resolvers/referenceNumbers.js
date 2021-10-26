const { isAdmin } = require("../permissions");
const {
  ReferenceNumberService,
} = require("@allocations/reference-number-service");
const ReferenceNumberSchema = require("../schema/referenceNumbers");

const Schema = ReferenceNumberSchema;

const ReferenceNumber = {};

const Queries = {
  referenceNumbersByDealId: async (_, { deal_id }) => {
    const res = await ReferenceNumberService.numbersByDealId({ deal_id });
    console.log("RES", res);
  },
};

const Mutations = {
  referenceNumbersAllocate: async (_parent, { deal_id }, ctx) => {
    isAdmin(ctx);
    return ReferenceNumberService.allocate({ deal_id });
  },
  referenceNumbersAssign: async (_parent, { deal_id }, ctx) => {
    isAdmin(ctx);
    return ReferenceNumberService.assign({ deal_id });
  },
  referenceNumbersRelease: async (_parent, { referenceNumbers }, ctx) => {
    isAdmin(ctx);
    return ReferenceNumberService.release({ referenceNumbers });
  },
  referenceNumbersReleaseByDealId: async (_parent, { deal_id }, ctx) => {
    isAdmin(ctx);
    return ReferenceNumberService.releaseByDealId({ deal_id });
  },
};

const Subscriptions = {};

module.exports = {
  Schema,
  Queries,
  Mutations,
  Subscriptions,
  subResolvers: { ReferenceNumber },
};
