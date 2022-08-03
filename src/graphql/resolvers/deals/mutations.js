const { ObjectId } = require("mongodb");
const fetch = require("node-fetch");
const moment = require("moment");
const { v4: uuid } = require("uuid");
const { isAdmin, ensureFundAdmin } = require("../../permissions");
const DealDocUploader = require("../../../uploaders/deal-docs");
const Mailer = require("../../../mailers/mailer");
const txConfirmationTemplate = require("../../../mailers/templates/tx-confirmation-template");
const { nWithCommas } = require("../../../utils/common.js");
const {
  deallocateReferenceNumbers,
} = require("../../helpers/newDirections/utils");

const Mutations = {
  /** create deal ensures there isn't already a deal form org with same name **/
  createDeal: async (_parent, { deal, org: orgSlug }, ctx) => {
    const org = await ensureFundAdmin(orgSlug, ctx);

    const res = await ctx.datasources.deals.createDeal({
      user_id: ctx.user._id,
      deal: {
        ...deal,
        _id: ObjectId(deal._id) || undefined,
        organization: org._id,
        status: deal.status || "onboarding",
        dealParams: deal.dealParams || {},
        created_at: Date.now(),
        inviteKey: uuid(),
      },
    });

    if (process.env.NODE_ENV === "production") {
      // TODO: move to a service
      await fetch("https://hooks.zapier.com/hooks/catch/7904699/onwul0r/", {
        method: "post",
        body: JSON.stringify({
          dealId: res._id,
          organization: org.name,
          dealName: deal.company_name,
        }),
        headers: { "Content-Type": "application/json" },
      });
    }

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
      await deallocateReferenceNumbers({
        dealDataSource: ctx.datasources.deals,
        deal_id: _id,
      });

      /* TODO how to handle look up of users in legacy*/
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
      const currentDeal = await ctx.datasources.deals.getDealById({
        deal_id: ObjectId(_id),
      });
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
      await deallocateReferenceNumbers({
        dealDataSource: ctx.datasources.deals,
        deal_id: _id,
      });

      // delete deal and all investments in deal
      await ctx.db.investments.deleteMany({ deal_id: ObjectId(_id) });
      return ctx.datasources.deals.deleteDealById({ deal_id: _id });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log("Error Deleting Deal :>>", e);
      return false;
    }
  },
  /** upload deal doc, S3 & db **/
  addDealDoc: async (_, params, ctx) => {
    // isAdmin(ctx);
    const path = await DealDocUploader.addDoc(params);
    await ctx.db.deals.updateOne(
      { _id: ObjectId(params.deal_id) },
      { $push: { documents: path } }
    );
    return ctx.db.deals.findOne({ _id: ObjectId(params.deal_id) });
  },
  addDealLogo: async (_, params, ctx) => {
    isAdmin(ctx);
    const path = await DealDocUploader.uploadImage(params);
    await ctx.db.deals.updateOne(
      { _id: ObjectId(params.deal_id) },
      { $set: { dealCoverImageKey: path } }
    );
    return ctx.db.deals.findOne({ _id: ObjectId(params.deal_id) });
  },
  rmDealLogo: async (_, params, ctx) => {
    isAdmin(ctx);
    const deal = await ctx.db.deals.findOne({ _id: ObjectId(params.deal_id) });
    await DealDocUploader.rmImage(deal.dealCoverImageKey);
    await ctx.db.deals.updateOne(
      { _id: ObjectId(params.deal_id) },
      { $unset: { dealCoverImageKey: "" } }
    );
    return ctx.db.deals.findOne({ _id: ObjectId(params.deal_id) });
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
};

module.exports = Mutations;
