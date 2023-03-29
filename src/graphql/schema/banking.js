const { gql } = require("apollo-server-express");

module.exports = gql(`

type Banking {
    balance: String
    routing_number: String
    account_number: String
    transactions: [Transaction]
}
type Transaction {
    _id: String
    created_at: String
    updated_at: String
    date: String
    status: String
    type: String
    name: String
    category: String
    investment_id: String
    amount: Float
}
extend type Query {
    banking(deal_id: String!): Banking
}
`);
