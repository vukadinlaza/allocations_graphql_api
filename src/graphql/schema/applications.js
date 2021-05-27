const { gql } = require('apollo-server-express')

module.exports = gql(`
  type Application {
    _id: String
    closeDate: String
    disqualifyEvent: String
    email: String
    exchangeAct: String
    issuerName: String
    phoneNumber: String
    principalName: [String]
    priorRaise: String
    raiseAmount: String
    raiseType: String
    research: String
    withinUS: String
  }

  input ApplicationInput {
    _id: String
    closeDate: String
    disqualifyEvent: String
    email: String
    exchangeAct: String
    issuerName: String
    phoneNumber: String
    principalName: [String]
    priorRaise: String
    raiseAmount: String
    raiseType: String
    research: String
    withinUS: String
  }

  extend type Mutation {
    createApplication(application: ApplicationInput!): Application
  }

  extend type Query {
    application(_id: String): Application
  }
`)
