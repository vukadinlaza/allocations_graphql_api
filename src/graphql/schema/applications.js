const { gql } = require("apollo-server-express");

module.exports = gql(`
type Application {
  _id: String
  closeDate: String
  disqualifyEvent: Boolean
  fundingVehicle: Boolean
  priorRaise: Boolean
  research: Boolean
  withinUS: Boolean
  exchangeAct: Boolean
  email: String
  issuerName: String
  phoneNumber: String
  principalName: [String]
  raiseAmount: String
  raiseType: String
  pitchDocument: Document
}

input ApplicationInput {
  _id: String
  closeDate: String
  disqualifyEvent: Boolean
  fundingVehicle: Boolean
  priorRaise: Boolean
  research: Boolean
  withinUS: Boolean
  exchangeAct: Boolean
  email: String
  issuerName: String
  phoneNumber: String
  principalName: [String]
  raiseAmount: String
  raiseType: String
  pitchDocument: Upload
}

extend type Query {
  application(_id: String): Application
}

extend type Mutation {
  createApplication(application: ApplicationInput!): Application
}
`);
