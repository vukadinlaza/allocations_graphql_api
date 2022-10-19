const { ObjectId } = require("mongodb");
const Cloudfront = require("../../../cloudfront");
const fetch = require("node-fetch");

const Investment = {
  deal: (investment, _, { datasources }) => {
    return datasources.deals.getDealById({ deal_id: investment.deal_id });
  },
  investor: (investment, _, { db }) => {
    return db.collection("users").findOne({ _id: investment.user_id });
  },
  documents: async (investment) => {
    if (Array.isArray(investment.documents)) {
      return investment.documents.map((path) => {
        return {
          link: Cloudfront.getSignedUrl(encodeURIComponent(path)),
          path,
        };
      });
    } else {
      const investmentDocumentsRes = await fetch(
        `${process.env.CORE_API}/api/v2/investments/${investment._id}/agreements`,
        {
          method: "GET",
          headers: { "X-API-TOKEN": process.env.ALLOCATIONS_TOKEN },
          credentials: "include",
        }
      );
      const investmentDocuments = await investmentDocumentsRes.json();
      if (investmentDocuments)
        return investmentDocuments.map((i) => ({
          path: i.type,
          link: i.link,
        }));
      return [];
    }
  },
  value: async (investment, _, { datasources }) => {
    const deal = await datasources.deals.getDealById({
      deal_id: ObjectId(investment.deal_id),
    });
    const multiple = parseInt(deal?.dealParams?.dealMultiple || 1);
    const value = investment.amount * multiple;
    return value;
  },
  wire_instructions: (investment) => {
    if (!investment?.wire_instructions?.s3Key) return null;
    return {
      link: Cloudfront.getSignedUrl(investment.wire_instructions?.s3Key),
      path: investment.wire_instructions?.s3Key,
    };
  },
};

module.exports = {
  Investment,
};
