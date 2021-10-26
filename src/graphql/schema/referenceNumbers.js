const { gql } = require("apollo-server-express");

module.exports = gql(`
type ReferenceNumber {
  _id: String
  number: String
  available: Boolean
  deal_id: ID
}

type ReleaseResponse {
    success: Boolean
    modifiedCount: Int
}

extend type Query {
  referenceNumbersByDealId(deal_id: String!): [ReferenceNumber]
}

extend type Mutation {
  referenceNumbersAllocate(deal_id: String!): [ReferenceNumber]
  referenceNumbersAssign(deal_id: String!): [ReferenceNumber]
  referenceNumbersRelease(referenceNumbers: [String]!): ReleaseResponse
  referenceNumbersReleaseByDealId(deal_id: String!): ReleaseResponse
}
`);
