const { CryptoService } = require("@allocations/crypto-service");
const Schema = require("../schema/crypto-payments");

const Mutations = {
  createInvestmentTransaction: async (_parent, { transactionInfo }) => {
    const result = await CryptoService.createInvestmentTransaction(
      transactionInfo
    );
    return result;
  },
};

const Queries = {
  walletBalance: async (_, { deal_id }, { db }) => {
    return CryptoService.getBalance(deal_id);
  },
};

module.exports = {
  Queries,
  Schema,
  Mutations,
};
