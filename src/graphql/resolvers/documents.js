const { gql } = require("apollo-server-express");

// TODO: add to schemas
const Schema = gql`
  type Document {
    path: String
    link: String
  }

  type File {
    filename: String!
    mimetype: String!
    encoding: String!
  }
`;

module.exports = { Schema };
