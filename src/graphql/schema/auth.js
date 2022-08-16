const { gql } = require("apollo-server-express");

module.exports = gql(`

type Auth0AuthReponse {
    hasEmailConnection: Boolean
    hasPWConnection: Boolean
}

extend type Query {
    search_auth_users(email: String!): Auth0AuthReponse
}
`);
