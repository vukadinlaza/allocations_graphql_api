const { gql } = require("apollo-server-express");

module.exports = gql(`

type Auth0AuthReponse {
   data: Object
}

extend type Query {
    search_auth0_users(email: String): Auth0AuthReponse
}


`);
