const { ObjectId } = require("mongodb");
const { AuthenticationError } = require("apollo-server-express");
const Cloudfront = require("../../../cloudfront");
const { throwApolloError } = require("../../../utils/common");
const { isAdmin } = require("../../permissions");
const { fetchInvest } = require("../../../utils/invest");

const User = {
  /** invited deal show deal info based on ctx (if invited) **/
  invitedDeal: async (user, { deal_slug, fund_slug }, ctx) => {
    const fund = await ctx.db.organizations.findOne({ slug: fund_slug });
    const deal = await ctx.datasources.deals.getDealByOrgIdAndDealslug({
      deal_slug: deal_slug,
      fund_id: ObjectId(fund._id),
    });

    if (deal) return deal;
    throw new AuthenticationError("REDIRECT");
  },
  investments: (user, { deal_id }, { datasources }) => {
    const query = {
      user_id: ObjectId(user._id),
    };
    if (deal_id) {
      query.deal_id = ObjectId(deal_id);
    }
    return datasources.investments.getAllInvestments(query);
  },
  passport: (user) => {
    return user.passport
      ? { link: Cloudfront.getSignedUrl(user.passport), path: user.passport }
      : null;
  },
  accredidation_doc: (user) => {
    return user.accredidation_doc
      ? {
          link: Cloudfront.getSignedUrl(user.accredidation_doc),
          path: user.accredidation_doc,
        }
      : null;
  },
  name: (user) => {
    const nameOrEmail =
      !user.first_name && !user.last_name
        ? user.email
        : `${user.first_name} ${user.last_name}`;
    const entityOrEmail =
      user.investor_type === "entity" && user.entity_name
        ? user.entity_name
        : user.email;

    return user.investor_type === "entity" && user.entity_name
      ? entityOrEmail
      : nameOrEmail;
  },
  organizations_admin: (user, _, { db }) => {
    if (user.admin) {
      // super admin can see all funds
      return db.organizations.find().toArray();
    }

    return db.organizations
      .find({
        _id: { $in: (user.organizations_admin || []).map(ObjectId) },
      })
      .toArray();
  },
  deals: async (user, _, { datasources }) => {
    const deals = await Promise.all(
      (user.organizations_admin || []).map((org) => {
        return (
          datasources.deals.getAllDeals({ organization: ObjectId(org) }) || []
        );
      })
    );

    return deals.reduce((acc, org) => [...acc, ...org], []);
  },
  investorPersonalInfo: async (_, args, ctx) => {
    const { user, datasources } = ctx;
    let userInvesments = await datasources.investments.getAllInvestments({
      user_id: user._id,
    });
    let lastInvestment = userInvesments
      .filter((investment) => investment.submissionData)
      .pop();
    return lastInvestment;
  },
  investorTaxDocuments: async (user, args, ctx) => {
    const { db } = ctx;
    const u = await db.users.findOne({ _id: ObjectId(user._id) });
    if (!u) {
      return [];
    }

    const docs =
      u.documents
        ?.filter((d) => d && d.submissionId && d.submissionId.includes("sub"))
        .map((d) => ({
          link: `app.docspring.com/submissions/${d.submissionId}/download`,
          name: d.documentName,
        })) || [];
    return docs;
  },
  // SERVICE API
  serviceInvestments: async (_, args, ctx) => {
    try {
      isAdmin(ctx);
      const investments = await fetchInvest(
        `/api/v1/investments/investments-by-user/${args._id || ctx.user._id}`
      );
      return investments;
    } catch (e) {
      throwApolloError(e, "newUserInvestments");
    }
  },
};

module.exports = {
  User,
};
