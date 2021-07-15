const { gql } = require("apollo-server-express");

const Schema = gql`
  type Document {
    path: String
    link: String
    createdAt: Float,
    updatedAt: Float,
    type: String,
    fileName: String
  }

  type File {
    filename: String!
    mimetype: String!
    encoding: String!
  }
`;

module.exports = { Schema };
