const { isAdmin } = require("../../permissions");
const { customDocumentPagination } = require("../../pagHelpers");
const Cloudfront = require("../../../cloudfront");

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
      "tim@allocations.com",
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

module.exports = Queries;
