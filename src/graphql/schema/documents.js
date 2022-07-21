const { gql } = require("apollo-server-express");

module.exports = gql`
  scalar Date

  type Document {
    path: String
    link: String
    documentName: String
    userEmail: String
    source: String
  }

  type ServiceDocument {
    _id: String
    deal_id: String
    task_id: String
    title: String
    bucket: String
    path: String
    link: String
    content_type: String
    complete: Boolean
    created_by: ID
    createdAt: String
    updatedAt: String
  }

  type File {
    filename: String!
    mimetype: String!
    encoding: String!
  }

  type DocumentPagination {
    count: Int
    documents: [Document]
  }

  extend type Query {
    documentsManagement(
      documentType: Object
      pagination: PaginationInput!
    ): DocumentPagination
  }
`;
