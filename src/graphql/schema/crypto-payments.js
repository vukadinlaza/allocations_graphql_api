const { gql } = require("apollo-server-express");

module.exports = gql(`

input TransactionInfo {
    deal_id: String!
    transaction_hash : String!
    user_id: String!
    deal_name: String!
    user_name: String!
    user_email: String!
}

type SuccessResponse {
    acknowledged: Boolean
    _id: String
}

extend type Mutation {
    createInvestmentTransaction(transactionInfo: TransactionInfo!): SuccessResponse
}

extend type Query {
    walletBalance(deal_id: String!): WalletBalanceResponse
}

type Balance {
    amount: String
    currency: String
 }
 
 type WalletBalanceResponse {
    acknowledged: Boolean
    balances: [Balance]
 }

`);
