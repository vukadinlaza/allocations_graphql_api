const { gql } = require("apollo-server-express");

module.exports = gql(`

type CryptoOptionsResponse {
    _id: String
    crypto_payments: Boolean
    deal_id: String,
    deal_name: String,
    activated_user: String,
}

extend type Query {
    cryptoOptions(deal_id: String!): CryptoOptionsResponse
}


`);
