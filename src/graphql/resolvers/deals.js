const { ObjectId } = require("mongodb");
const _ = require("lodash");
const { kebabCase } = require("lodash");

const fetch = require("node-fetch");
const moment = require("moment");
const { v4: uuid } = require("uuid");
const {
  AuthenticationError,
  UserInputError,
} = require("apollo-server-express");
const { isAdmin, ensureFundAdmin } = require("../permissions");
const Cloudfront = require("../../cloudfront");
const DealDocUploader = require("../../uploaders/deal-docs");
const Deals = require("../schema/deals");
const Mailer = require("../../mailers/mailer");
const txConfirmationTemplate = require("../../mailers/templates/tx-confirmation-template");
const { nWithCommas } = require("../../utils/common.js");
const { customDealPagination } = require("../pagHelpers");
const { getHighlights } = require("../mongoHelpers.js");
const { DealService } = require("@allocations/deal-service");
const {
  InvestmentAgreementService,
} = require("@allocations/investment-agreement-service");

const Schema = Deals;
const Deal = {
  // investment denotes the `ctx.user` investment in this deal (can only be one)
  investment: (deal, _, { db, user }) => {
    return db.collection("investments").findOne({
      deal_id: ObjectId(deal._id),
      user_id: ObjectId(user._id),
    });
  },
  investments: (deal, _, { db }) => {
    return db.investments.find({ deal_id: deal._id }).toArray();
  },
  wireInstructions: (deal) => {
    return deal.wireInstructions
      ? Cloudfront.getSignedUrl(deal.wireInstructions)
      : null;
  },
  documents: async (deal) => {
    return deal.documents
      ? deal.documents.map((d) => ({
          link: Cloudfront.getSignedUrl(d),
          path: d.split("/")[2],
        }))
      : null;
  },
  organization: (deal, _, { db }) => {
    return db.organizations.findOne({ _id: deal.organization });
  },
  approved: async (deal, _, { db }) => {
    const org = await db.organizations.findOne({ _id: deal.organization });
    return org.approved !== false;
  },
  dealParams: (deal) => {
    let m = 1;
    if (deal.dealParams && deal.dealParams !== null) {
      m = parseFloat(deal.dealParams.dealMultiple || "1");
      deal.dealParams.dealMultiple = m;
    }
    return deal.dealParams || {};
  },
  appLink: async (deal, _, { db }) => {
    const { slug } = await db.organizations.findOne({ _id: deal.organization });
    return slug && slug !== "allocations"
      ? `/deals/${slug}/${deal.slug}`
      : `/deals/${deal.slug}`;
  },
  publicLink: async (deal, _, { db }) => {
    const { slug } = await db.organizations.findOne({ _id: deal.organization });
    return `/public/${slug}/deals/${deal.slug}?invite_code=${deal.inviteKey}`;
  },
  raised: async (deal, _, { db }) => {
    const investments = await db.investments
      .find({ deal_id: deal._id })
      .toArray();
    const amount = investments.reduce((acc, inv) => {
      const amount = Number.isInteger(inv.amount) ? inv.amount : 0;
      return acc + amount;
    }, 0);
    return amount;
  },
  viewedUsers: async (deal, _, { db }) => {
    return await Promise.all(
      (deal.usersViewed || []).map((user) => {
        return db.users.findOne({ _id: user });
      })
    );
  },
  dealOnboarding: async (deal, _, { db }) => {
    const dealOnboarding = await db.dealOnboarding.findOne({
      dealName: deal.company_name,
    });

    return dealOnboarding;
  },
  AUM: async (deal, _, { db }) => {
    if (deal.AUM) return deal.AUM;
    const wiredInvestments = await db.investments
      .find({ deal_id: deal._id, status: { $in: ["wired", "complete"] } })
      .toArray();
    const aum = wiredInvestments.length
      ? wiredInvestments
          .map((inv) => inv.amount)
          .reduce((acc, n) => Number(acc) + Number(n))
      : 0;
    return aum;
  },
  metadata: async (deal, _, ctx) => {
    return deal;
  },
};

const Queries = {
  deal: async (_, args, ctx) => {
    const org = await ctx.db.organizations.findOne({ slug: args.fund_slug });
    if (org !== null && args.deal_slug) {
      const result = await ctx.datasources.deals.getDealByOrgIdAndDealslug({
        deal_slug: args.deal_slug,
        fund_id: org._id,
      });
      return result;
    }
    return ctx.datasources.deals.getDealById({ deal_id: ObjectId(args._id) });
  },
  allDeals: (_, args, { datasources }) => {
    isAdmin(ctx);
    return datasources.deals.getAllDeals({});
  },
  searchDeals: (_, { q, limit }, ctx) => {
    isAdmin(ctx);
    return ctx.db.deals
      .find({
        company_name: { $regex: new RegExp(q), $options: "i" },
      })
      .limit(limit || 10)
      .toArray();
  },
  /** Search query for any deals on an org **/
  searchDealsByOrg: async (_, { q, org: orgSlug, limit }, ctx) => {
    const org = await ensureFundAdmin(orgSlug, ctx);
    return ctx.db.deals
      .find({
        organization: org._id,
        company_name: { $regex: new RegExp(q), $options: "i" },
      })
      .limit(limit || 10)
      .toArray();
  },
  /** Public Deal fetches the deal info WITHOUT auth **/
  publicDeal: async (_, { deal_slug, fund_slug }, { db, datasources }) => {
    const fund = await db.organizations.findOne({ slug: fund_slug });

    const deal = await datasources.deals.getDealByOrgIdAndDealslug({
      deal_slug: deal_slug,
      fund_id: fund._id,
    });

    if (deal) return deal;

    throw new AuthenticationError("permission denied");
  },
  /** gets fund admin highlights tab data **/
  fundAdminHighlights: async (_, args, { db }) => {
    const highlights = await db.deals.aggregate(getHighlights()).toArray();
    return highlights[0];
  },
  /** Gets fund admin Funds/SPVs tabs data**/
  fundAdminTables: async (_, args, ctx) => {
    isAdmin(ctx);
    const { pagination, currentPage } = args.pagination;
    const documentsToSkip = pagination * currentPage;
    const aggregation = customDealPagination(args.pagination, args.filter);
    const countAggregation = [...aggregation, { $count: "count" }];

    const dealsCount = await ctx.db
      .collection("deals")
      .aggregate(countAggregation)
      .toArray();
    const count = dealsCount.length ? dealsCount[0].count : 0;

    let deals = await ctx.db
      .collection("deals")
      .aggregate(aggregation)
      .skip(documentsToSkip)
      .limit(pagination)
      .toArray();

    deals = deals.map((item) => item.deal);

    return { count, deals };
  },
  getDealWithTasks: async (_, { deal_id }) => {
    const deal = await DealService.get(deal_id);
    return deal;
  },
  getDealDocService: async (_, { task_id }, ctx) => {
    isAdmin(ctx);
    const doc = await DealService.getDocumentByTaskId(task_id);
    return doc;
  },
  getServiceAgreementLink: async (_, { deal_id }) => {
    console.log(deal_id);
    return DealService.getServiceAgreementLink(deal_id);
  },
  getInvestmentAgreementLink: async (_, { deal_id }) => {
    return InvestmentAgreementService.getFmSignatureLink(deal_id);
  },
};

const Mutations = {
  /** create deal ensures there isn't already a deal form org with same name **/
  createDeal: async (_parent, { deal, org: orgSlug }, ctx) => {
    const org = await ensureFundAdmin(orgSlug, ctx);
    const slug = _.kebabCase(deal.company_name);
    // ensure that deal name with org doesn't exist
    const collision = await ctx.datasources.deals.getDealByOrgIdAndDealslug({
      deal_slug: slug,
      fund_id: org._id,
    });
    if (collision) {
      throw new Error("Deal with same name already exists");
    }

    const res = await ctx.datasources.deals.createDeal({
      user_id: ctx.user._id,
      deal: {
        ...deal,
        organization: org._id,
        status: "onboarding",
        dealParams: {},
        slug,
        created_at: Date.now(),
        inviteKey: uuid(),
      },
    });

    if (process.env.NODE_ENV === "production") {
      // TODO: move to a service
      await fetch("https://hooks.zapier.com/hooks/catch/7904699/onwul0r/", {
        method: "post",
        body: JSON.stringify({
          dealId: res.ops[0]._id,
          organization: org.name,
          dealName: deal.company_name,
        }),
        headers: { "Content-Type": "application/json" },
      });
    }

    return res.ops[0];
  },
  /** special handling for wire instructions upload **/
  updateDealService: async (_, args, ctx) => {
    isAdmin(ctx);
    const res = await DealService.completeAdminTask({
      fields: args.payload,
      user_id: ctx.user._id,
      ...args,
    });
    return res;
  },
  updateDealTask: async (_, { payload, ...args }, ctx) => {
    isAdmin(ctx);
    const res = await DealService.completeReview({ fields: payload, ...args });
    if (res.error) throw new UserInputError(res.error);
    return res;
  },
  updateDeal: async (_, { org, deal: { _id, wireDoc, ...deal } }, ctx) => {
    await ensureFundAdmin(org, ctx);

    if (wireDoc) {
      // upload wireDoc
      deal.wireInstructions = await DealDocUploader.addDoc({
        doc: wireDoc,
        title: "wire-instructions",
        deal_id: _id,
      });
    }

    if (deal.status === "closed") {
      const investments = await ctx.db.investments
        .aggregate([
          { $match: { deal_id: ObjectId(_id) } },
          {
            $lookup: {
              from: "users",
              localField: "user_id",
              foreignField: "_id",
              as: "user",
            },
          },
          { $unwind: "$user" },
          {
            $project: { user: { email: 1, first_name: 1 }, amount: 1 },
          },
        ])
        .toArray();

      await ctx.db.investments.updateMany(
        { deal_id: ObjectId(_id), status: "wired" },
        { $set: { status: "complete" } }
      );

      if (investments.length && deal && deal.slug === "luna-mega") {
        const price = 50;
        investments.forEach(async (investment) => {
          const { user } = investment;
          const emailData = {
            mainData: {
              to: user.email,
              from: "support@allocations.com",
              subject: `Commitment to invest`,
            },
            template: txConfirmationTemplate,
            templateData: {
              username: user.first_name ? `${user.first_name}` : user.email,
              issuer: deal.company_name || "",
              type: "SAFE",
              price,
              totalSold: nWithCommas(investment.amount * 5),
              totalAmount: nWithCommas(investment.amount),
              unitsOwned: nWithCommas(investment.amount / price),
              date: moment(new Date()).format("MMM DD, YYYY"),
            },
          };

          await Mailer.sendEmail(emailData);
        });
      }
    }

    if (deal.dealParams) {
      const currentDeal = await ctx.db.deals.findOne({ _id: ObjectId(_id) });
      deal.dealParams = { ...currentDeal.dealParams, ...deal.dealParams };
    }

    const res = await ctx.datasources.deals.updateDealById({
      deal_id: _id,
      deal,
    });
    return res;
  },
  /** delete Deal and all associated investment records **/
  deleteDeal: async (_, body, ctx) => {
    const { _id } = body;
    isAdmin(ctx);

    try {
      // delete deal and all investments in deal
      await ctx.db.investments.deleteMany({ deal_id: ObjectId(_id) });
      return ctx.datasources.deals.deleteDealById({ deal_id: _id });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log(e);
      return false;
    }
  },
  /** case where new user is creating an org & a deal simultaneously **/
  createOrgAndDeal: async (_parent, { orgName, deal }, { db, user }) => {
    // no auth required for this (anyone can do it once signed in)

    const slug = _.kebabCase(orgName);
    // ensure no collision
    if (await db.organizations.findOne({ slug })) {
      throw new Error("name collision");
    }

    const {
      ops: [org],
    } = await db.organizations.insertOne({
      name: orgName,
      created_at: Date.now(),
      slug,
      approved: true,
    });

    // add user to org admin
    await db.users.updateOne(
      { _id: user._id },
      { $push: { organizations_admin: org._id } }
    );

    const res = await ctx.datasources.deals.createDeal({
      user_id: ctx.user._id,
      deal: {
        ...deal,
        slug: _.kebabCase(deal.company_name || deal.airtableId),
        organization: org._id,
        status: deal.status ? deal.status : "onboarding",
        dealParams: {},
        created_at: Date.now(),
        inviteKey: uuid(),
      },
    });

    if (process.env.NODE_ENV === "production") {
      await fetch("https://hooks.zapier.com/hooks/catch/7904699/onwul0r/", {
        method: "post",
        body: JSON.stringify({
          dealId: res._id,
          organization: orgName,
          dealName: deal.company_name,
        }),
        headers: { "Content-Type": "application/json" },
      });
    }
    return res;
  },
  /** upload deal doc, S3 & db **/
  addDealDoc: async (_, params, ctx) => {
    isAdmin(ctx);
    const path = await DealDocUploader.addDoc(params);
    await ctx.db.deals.updateOne(
      { _id: ObjectId(params.deal_id) },
      { $push: { documents: path } }
    );
    return ctx.db.deals.findOne({ _id: ObjectId(params.deal_id) });
  },
  addDealDocService: async (_, { deal_id, task_id, doc, phase }, ctx) => {
    isAdmin(ctx);
    const { user } = ctx;
    const document = await doc;
    function stream2buffer(stream) {
      return new Promise((resolve, reject) => {
        const _buf = [];
        stream.on("data", (chunk) => _buf.push(chunk));
        stream.on("end", () => resolve(Buffer.concat(_buf)));
        stream.on("error", (err) => reject(err));
      });
    }
    const buffer = await stream2buffer(document.createReadStream());

    await DealService.uploadDocument(buffer, {
      deal_id,
      task_id,
      user_id: user._id,
      phase,
      content_type: document.mimetype,
      title: document.filename,
    });

    return DealService.get(deal_id);
  },
  addDealLogo: async (_, params, ctx) => {
    const serviceDeal = DealService.get(params.deal_id);
    if (serviceDeal) {
      const { deal_id, task_id, phase, document } = params;
      const d = await doc;
      function stream2buffer(stream) {
        return new Promise((resolve, reject) => {
          const _buf = [];
          stream.on("data", (chunk) => _buf.push(chunk));
          stream.on("end", () => resolve(Buffer.concat(_buf)));
          stream.on("error", (err) => reject(err));
        });
      }
      const buffer = await stream2buffer(d.createReadStream());

      await DealService.uploadDocument(buffer, {
        deal_id,
        task_id,
        user_id: user._id,
        phase,
        content_type: d.mimetype,
        title: d.filename,
      });

      return DealService.get(deal_id);
    }
    const path = await DealDocUploader.uploadImage(params);
    await ctx.db.deals.updateOne(
      { _id: ObjectId(params.deal_id) },
      { $set: { dealCoverImageKey: path } }
    );
    return ctx.db.deals.findOne({ _id: ObjectId(params.deal_id) });
  },
  rmDealLogo: async (_, params, ctx) => {
    isAdmin(ctx);
    await DealDocUploader.rmImage(params);
    await ctx.db.deals.updateOne(
      { _id: ObjectId(params.deal_id) },
      { $unset: { dealCoverImageKey: "" } }
    );
    return ctx.db.deals.findOne({ _id: ObjectId(params.deal_id) });
  },
  addDealDocs: async (_, { deal_id, docs }, ctx) => {
    isAdmin(ctx);

    await docs.map(async (doc) => {
      const path = await DealDocUploader.addDoc({ deal_id, doc });
      await ctx.db.deals.updateOne(
        { _id: ObjectId(deal_id) },
        { $push: { documents: path } }
      );
      return path;
    });
    return ctx.db.deals.findOne({ _id: ObjectId(deal_id) });
  },
  /** delete deal doc, S3 & db **/
  rmDealDoc: async (_, params, ctx) => {
    isAdmin(ctx);
    const path = await DealDocUploader.rmDoc(params);
    return ctx.db.deals.updateOne(
      { _id: ObjectId(params.deal_id) },
      { $pull: { documents: path } }
    );
  },
  addUserAsViewed: async (_, { user_id, deal_id }, ctx) => {
    const deal = await ctx.db.deals.findOne({ _id: ObjectId(deal_id) });
    if (!deal) return {};
    if (
      (deal.usersViewed || [])
        .map((i) => String(i))
        .find((id) => id === user_id)
    ) {
      return deal;
    }
    return ctx.db.deals.updateOne(
      { _id: ObjectId(deal_id) },
      { $push: { usersViewed: ObjectId(user_id) } }
    );
  },
  deleteUserAsViewed: async (_, { user_id, deal_id }, ctx) => {
    return ctx.db.deals.updateOne(
      { _id: ObjectId(deal_id) },
      {
        $pull: { usersViewed: ObjectId(user_id) },
      }
    );
  },
  createBuild: async (_, __, { user }) => {
    const deal = await DealService.create(user._id);
    const x = await DealService.get(deal._id);
    return x;
  },
  setBuildInfo: async (_, { deal_id, payload }, { user }) => {
    console.log("PAYLOAD", payload);

    // Mock data for Demo purposes
    const mockDealData = {
      // What payload will contain
      name: payload.portfolio_company_name || "Super App SPV",
      slug: kebabCase(payload.portfolio_company_name),
      asset_type: "startup",
      portfolio_company_name: payload.portfolio_company_name || "Tundra Trust",
      manager: {
        name: "Lance Merrill",
        // Double check type
        type: "individual",
        // email will be grabbed from user.email
        email: "test123@allocations.com",
        // title & entity_name not required & currently not in payload
        title: "",
        entity_name: "",
      },
      closing_date: Date.now(),
      carry_fee: {
        type: "percent",
        value: "20", // we want %
        string_value: "Twenty percent",
      },
      management_fee: {
        type: "percent",
        value: "10%", // We wamt %,
        string_value: "Ten percent",
      },
      management_fee_frequency: "one-time",
      side_letters: false,
      // If investment_advisor === true chage to "Sharding Advisers LLC"
      investment_advisor: "Sharding Advisers LLC",
      custom_investment_agreement: false,
      offering_type: "506c",
      industry: "Space",
      // Optional and might not come in Payload
      memo: "some memo",

      // Properties required in Schema but not provided in payload
      // Grab org ID
      organization_id: ObjectId("5ecd1a79563730002301759b"),
      user_id: user._id,
      wire_deadline: Date.now(),
      sign_deadline: Date.now(),
      ica_exemption: {
        investor_type: "Accredited investors",
        exemption_type: "301",
      },

      // Properties not required in Schema and not included in payload
      legal_spv_name: "Atomizer 38",
      master_series: "Atomizers",
      setup_cost: 20000,
      angels_deal: true,
      deal_multiple: 0,
      description: "some description",
      spv_term: "Some terms",
      // minimum_subscription_amount is defaulted to 10000 in schema
      minimum_subscription_amount: 10000,
    };

    // TODO: Use this dealData for non Demo
    const dealData = {
      ...payload,
      // TODO: Grab organization_id
      organization_id: ObjectId("5ecd1a79563730002301759b"),
      user_id: user._id,
      // TODO: Grab deadlines from somewhere
      wire_deadline: Date.now(),
      sign_deadline: Date.now(),
      // TODO: Grab ica_exemption
      ica_exemption: {
        investor_type: "Accredited investors",
        exemption_type: "301",
      },
    };

    const res = await DealService.setBuildInfo(deal_id, mockDealData);
    if (res.acknowledged) {
      return await DealService.get(res._id);
    }
    // Handle error
  },

  deleteDealDocument: async (
    _,
    { document_id, phase_id, task_id },
    { user }
  ) => {
    const res = await DealService.rejectDocument({
      id: document_id,
      phase: phase_id,
      user_id: user._id,
      task_id: task_id,
    });
    return res;
  },
};
// deleteUserAsViewed: async (_, { user_id, deal_id }, ctx) => {
//   return ctx.db.deals.updateOne(
//     { _id: ObjectId(deal_id) },
//     {
//       $pull: { usersViewed: ObjectId(user_id) },
//     }
//   );
// },
const Subscriptions = {
  dealOnboarding: {
    subscribe: async (_, args, { pubsub }) => {
      return pubsub.asyncIterator("dealOnboarding");
    },
  },
};

module.exports = {
  Schema,
  Queries,
  Mutations,
  Subscriptions,
  subResolvers: { Deal },
};
