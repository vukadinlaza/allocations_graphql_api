const { gql } = require("apollo-server-express");
const { isAdmin } = require("../permissions");
const { customDocumentPagination } = require("../pagHelpers");
const Cloudfront = require("../../cloudfront");

// TODO: add to schemas
const Schema = gql`
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

const Queries = {
  documentsManagement: async (_, args, ctx) => {
    isAdmin(ctx);

    const allowedEmails = [
      "lidia@allocations.com",
      "olia@allocations.com",
      "lindsay@allocations.com",
      "jared@allocations.com",
      "nicholas@allocations.com",
      "elizabeth@allocations.com",
      "adrian@allocations.com",
      "kingsley@allocations.com",
      "rachael@allocations.com",
      "rachel@allocations.com",
      "lance@allocations.com",
      "danny@allocations.com",
      "eli@allocations.com",
      "chase.abbott@allocations.com",
    ];

    if (!allowedEmails.includes(ctx.user.email)) {
      return { count: 0, documents: [] };
    }
    const { pagination, currentPage } = args.pagination;
    const documentsToSkip = pagination * currentPage;
    const aggregation = customDocumentPagination(
      args.pagination,
      args.documentType
    );
    const documentCollection = ["KYC", "K-12"].includes(args.documentType)
      ? "users"
      : "investments";
    const countAggregation = [...aggregation, { $count: "count" }];

    const documentsCount = await ctx.db
      .collection(documentCollection)
      .aggregate(countAggregation)
      .toArray();
    const count = documentsCount.length ? documentsCount[0].count : 0;

    let documents = await ctx.db
      .collection(documentCollection)
      .aggregate(aggregation)
      .skip(documentsToSkip)
      .limit(pagination)
      .toArray();

    documents = documents.map((item) => {
      const link = ["KYC", "K-12"].includes(args.documentType)
        ? `https://app.docspring.com/submissions/${item.documents.submissionId}/download`
        : Cloudfront.getSignedUrl(item.documents.link);
      return { ...item.documents, link };
    });

    return { count, documents };
  },
};

module.exports = {
  Schema,
  Queries,
};
