const { gql } = require("apollo-server-express");

module.exports = gql(`

type Auth0AuthReponse {
    hasEmailConnection: Boolean
    hasPWConnection: Boolean
}
type SuccessBoolean {
    success: Boolean
}

extend type Query {
    search_auth_users(email: String!): Auth0AuthReponse
    reset_password(email: String!): SuccessBoolean
}
`);
