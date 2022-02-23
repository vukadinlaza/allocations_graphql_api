const fetch = require("node-fetch");
const { throwApolloError } = require("../../utils/common.js");
const cryptoSchema = require("../schema/crypto-payments");
const Schema = cryptoSchema;

const Queries = {
  cryptoOptions: async (_, { deal_id }) => {
    try {
      const res = await fetch(
        `${process.env.ALLOCATIONS_CRYPTO_API_URL}/v1/crypto-options/${deal_id}`,
        {
          headers: {
            "X-API-TOKEN": process.env.ALLOCATIONS_TOKEN,
            "Content-Type": "application/json",
          },
        }
      );
      const cryptoResponse = res.json();
      if (!res.ok) {
        // don't error here on failed response, some deals won't have options set
        // We expect a 4xx upstream, but want to return as if no options exist
        return {};
      }
      return cryptoResponse;
    } catch (e) {
      throwApolloError(e, "cryptoOptions");
    }
  },
};

const Mutations = {};
const Subscriptions = {};
const subResolvers = {};

module.exports = {
  Schema,
  Queries,
  Mutations,
  Subscriptions,
  subResolvers,
};
