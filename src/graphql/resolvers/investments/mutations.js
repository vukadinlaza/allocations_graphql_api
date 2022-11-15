const { ObjectId } = require("mongodb");
const moment = require("moment");
const fetch = require("node-fetch");
const { get } = require("lodash");
const { UserInputError } = require("apollo-server-express");
const Cloudfront = require("../../../cloudfront");
const Uploader = require("../../../uploaders/investor-docs");
const {
  getInvestmentPreview,
  getTemplate,
  createCapitalAccountDoc,
} = require("../../../docspring");
const Mailer = require("../../../mailers/mailer");
const commitmentTemplate = require("../../../mailers/templates/commitment-template");
const { signedSPV } = require("../../../zaps/signedDocs");
const { DealService } = require("@allocations/deal-service");
const { sendWireReminderEmail } = require("../../../mailers/wire-reminder");
const { amountFormat, throwApolloError } = require("../../../utils/common");

const Mutations = {
  /** inits investment with appropriate status **/
  createInvestment: async (
    _,
    { investment: { user_id, deal_id, ...investment } },
    { db, datasources, user }
  ) => {
    let deal = await db.collection("deals").findOne({ _id: ObjectId(deal_id) });

    if (!deal) {
      deal = await DealService.get(deal_id);
    }
    console.log({ investment });
    const newInvestment = {
      status: "invited",
      invited_at: Date.now(),
      created_at: Date.now(),
      [`${investment.status}_at`]: Date.now(),
      ...investment,
      user_id: ObjectId(user_id),
      deal_id: ObjectId(deal_id),
      organization: ObjectId(deal.organization),
    };

    if (newInvestment.status !== "invited") {
      try {
        await datasources.investments.createInvestment({
          deal,
          user,
          investment: newInvestment,
        });
      } catch (error) {
        // throw more descriptive error
        throw new Error(`createInvestment failed: ${error.message}`);
      }
    }

    return newInvestment;
  },
  /** creates investment in legacy db **/
  createLegacyInvestment: async (
    _,
    { investment: { user_id, deal_id, ...investment } },
    { db }
  ) => {
    let deal = await db.collection("deals").findOne({ _id: ObjectId(deal_id) });

    if (!deal) {
      deal = await DealService.get(deal_id);
    }

    let user = await db.collection("users").findOne({ _id: ObjectId(user_id) });

    const newInvestment = {
      created_at: Date.now(),
      [`${investment.status}_at`]: Date.now(),
      ...investment,
      _id: ObjectId(investment._id),
      user_id: ObjectId(user_id),
      deal_id: ObjectId(deal_id),
      organization: ObjectId(deal.organization),
      submissionData: {
        investmentAmount: investment.amount,
        fullName: user.first_name
          ? `${user.first_name} ${user.last_name}`
          : user.email,
        legalName: user.legalName,
        investor_type: investment.type,
        country: investment.investor_country,
        state: investment.investor_state,
        accredited_investor_status: investment.accredited_investor_type,
      },
    };

    const legacyInvestment = await db
      .collection("investments")
      .insertOne(newInvestment);

    return legacyInvestment;
  },

  /** updates investment and tracks the status change **/
  updateInvestment: async (
    _,
    { investment: { _id, ...investment } },
    { db, datasources }
  ) => {
    try {
      // we need to track status changes
      const savedInvestment = await db.investments.findOne({
        _id: ObjectId(_id),
      });

      if (
        savedInvestment.status !== investment.status &&
        investment.status !== "wired"
      ) {
        investment[`${investment.status}_at`] = Date.now();
      }

      const updatedInvestment = {
        ...savedInvestment,
        ...investment,
      };

      await datasources.investments.updateInvestmentById(
        _id,
        updatedInvestment
      );
      return db.investments.updateOne(
        { _id: ObjectId(_id) },
        // { $set: { ...investment, updated_at: new Date() } },
        { $set: { ...investment, updated_at: Date.now() } },
        { new: true }
      );
    } catch (err) {
      throwApolloError(err, "updateInvestment");
    }
  },

  /** delete investment id**/
  deleteInvestment: async (_, { _id }, ctx) => {
    try {
      const res = await ctx.db.investments.deleteOne({ _id: ObjectId(_id) });
      return res.deletedCount === 1;
    } catch (err) {
      throwApolloError(err, "deleteInvestment");
    }
  },

  // Document Handling

  /** uploads investment document, S3 & db path **/
  addInvestmentDoc: async (_, { investment_id, doc, isK1 }, ctx) => {
    try {
      const file = await doc;
      const s3Path = await Uploader.putInvestmentDoc(investment_id, file, isK1);

      await ctx.db.investments.updateOne(
        { _id: ObjectId(investment_id) },
        { $addToSet: { documents: s3Path } }
      );

      return Cloudfront.getSignedUrl(s3Path);
    } catch (err) {
      throwApolloError(err, "addInvestmentDoc");
    }
  },
  /** deletes investment document, S3 & db path **/
  rmInvestmentDoc: async (_, { investment_id, file }, ctx) => {
    try {
      await Uploader.rmInvestmentDoc(investment_id, file);
      await ctx.db.investments.updateOne(
        { _id: ObjectId(investment_id) },
        { $pull: { documents: `investments/${investment_id}/${file}` } }
      );

      return true;
    } catch (err) {
      throwApolloError(err, "rmInvestmentDoc");
    }
  },

  confirmInvestment: async (_, { payload }, { user, db, datasources }) => {
    try {
      const deal = await datasources.deals.getDealById({
        deal_id: ObjectId(payload.dealId),
      });

      const organization = await db.organizations.findOne({
        _id: ObjectId(deal.organization),
      });

      if (deal !== null && deal.isDemo === true) {
        // needs to be a 24 character hex
        return { _id: "000000000000000000000000" };
      }

      let investment = null;

      // add case for undefined referenceNumber
      if (!payload.investmentId) {
        const newInvestmentData = {
          status: "invited",
          invited_at: Date.now(),
          created_at: Date.now(),
          amount: parseFloat(payload.investmentAmount.replace(/,/g, "")),
          user_id: ObjectId(user._id),
          deal_id: ObjectId(payload.dealId),
          organization: ObjectId(deal.organization),
          submissionData: payload,
        };

        const { insertedId } = await datasources.investments.createInvestment({
          deal,
          user,
          investment: newInvestmentData,
        });

        investment = await db.investments.findOne({
          _id: ObjectId(insertedId),
        });
      } else {
        investment = await datasources.investments.getInvestmentById({
          investment_id: ObjectId(payload.investmentId),
        });

        const updatedSubmissionData = {
          ...investment.submissionData,
          ...payload,
        };

        await datasources.investments.resignInvestment({
          investment_id: payload.investmentId,
          submissionData: updatedSubmissionData,
        });
      }

      const permanentDownloadUrl = await getTemplate({
        datasources,
        db,
        deal,
        payload: { ...payload, investmentId: investment._id },
        user,
        templateId: payload.docSpringTemplateId,
        investmentDocs: investment.documents,
        investmentStatus: investment.status,
      });

      await db.deals.updateOne(
        { _id: ObjectId(deal._id) },
        {
          $pull: { usersViewed: ObjectId(user._id) },
        }
      );

      if (deal && deal.slug === "luna-mega") {
        const emailData = {
          mainData: {
            to: user.email,
            from: "support@allocations.com",
            subject: `Commitment to invest`,
          },
          template: commitmentTemplate,
          templateData: {
            username: user.first_name ? `${user.first_name}` : user.email,
            issuer: deal.company_name || "",
            price: "$59",
            totalAmount: `$${payload.investmentAmount}`,
            deadline: moment(deal.dealParams.signDeadline)
              .subtract(2, "days")
              .format("MMM DD, YYYY"),
          },
        };
        await Mailer.sendEmail(emailData);
      }

      if (!permanentDownloadUrl)
        throw new UserInputError("There was an error with Docspring");

      let location = payload.country;
      if (payload.country === "United States")
        location = `${payload.country}, ${payload.state}`;

      const zapData = {
        ...investment,
        dealName: deal.company_name,
        permanentDownloadUrl,
        ...organization,
        email: user.email,
        location,
      };

      await signedSPV(zapData);

      return datasources.investments.getInvestmentById({
        investment_id: ObjectId(investment._id),
      });
    } catch (err) {
      throwApolloError(err, "confirmInvestment");
    }
  },

  getInvestmentPreview: async (_, { payload }, { user }) => {
    const res = await getInvestmentPreview({
      input: payload,
      templateId: payload.docSpringTemplateId,
      user,
    });
    return { ...user, previewLink: res.download_url };
  },

  sendWireReminders: async (
    _,
    { investment_ids, deal_id },
    { db, datasources }
  ) => {
    try {
      const deal = await datasources.deals.getDealById({ deal_id });
      const org = await db
        .collection("organizations")
        .findOne({ _id: ObjectId(deal.organization || deal.organization_id) });

      const currentTime = Math.round(new Date().getTime() / 1000);
      const yesterday = currentTime - 24 * 3600;
      const sentEmailsToday =
        deal.wireReminderSent >= new Date(yesterday * 1000).getTime();

      if (sentEmailsToday) {
        throw new Error("Wire reminders already sent today.");
      }

      const oids = investment_ids.map((id) => new ObjectId(id));
      const investments = await db
        .collection("investments")
        .aggregate([
          {
            $match: {
              _id: { $in: oids },
            },
          },
          {
            $lookup: {
              from: "users",
              localField: "user_id",
              foreignField: "_id",
              as: "user",
            },
          },
          {
            $unwind: {
              path: "$user",
            },
          },
        ])
        .toArray();

      const emailItems = await Promise.all(
        investments.map(async (investment) => {
          return {
            name:
              investment?.submissionData?.legalName ||
              investment.user.first_name ||
              investment.user.email,
            email: investment.user.email,
            investmentAmount: investment.amount,
            company_name: deal.company_name,
            org_slug: org.slug,
            deal_slug: deal.slug,
          };
        })
      );

      if (process.env.NODE_ENV === "production") {
        emailItems.forEach(async (email) => {
          await sendWireReminderEmail({ ...email });
        });

        await db
          .collection("deals")
          .updateOne(
            { _id: ObjectId(deal_id) },
            { $set: { wireReminderSent: new Date() } }
          );

        await db.investments.updateMany(
          { _id: { $in: oids } },
          {
            $set: {
              wireReminderSent: { availableToSend: false, date: new Date() },
            },
          }
        );
      }
      return true;
    } catch (err) {
      throwApolloError(
        { error: err.error || err.message, status: err.status },
        "sendWireReminders"
      );
    }
  },
  createCapPDF: async (_, { data }, { db, datasources }) => {
    const timeStamp = Date.now();

    const investment = await datasources.investments.getInvestmentById({
      investment_id: ObjectId(data.investmentId),
    });
    if (!investment) {
      return null;
    }
    const capDoc = get(investment, "documents", []).find((doc) =>
      doc.includes("Capital_Account_Statement")
    );
    if (capDoc) {
      await db.investments.updateOne(
        { _id: ObjectId(investment._id) },
        { $pull: { documents: capDoc } }
      );
    }

    const payload = {
      name: data.investorNameEntity ? data.investorNameEntity : data.name,
      dealName: data.legalName?.[0],
      notes: data.notes,
      currentDate: moment(new Date()).format("MMM DD, YYYY"),
      effectiveDate: moment(ObjectId(investment._id).getTimestamp()).format(
        "MMM DD, YYYY"
      ),
      subscriptionAmount: `$${amountFormat(data.currentAmountContributed)}`,
      privateFundExpenses: `$${amountFormat(data.privateFundExpenses)}`,
      managementFee: `$${amountFormat(data.managementFees$)}` || "$0",
      carryPercent: `${data.carry * 100 || "0"}%`,
      netInvestmentAmount: `$${amountFormat(data.netInvestment)}`,
      ownershipPercentage: `${(data.ownership * 100).toString()}%`,
    };

    const docspringRes = await createCapitalAccountDoc({ payload });
    const res = await fetch(docspringRes.download_url);

    const buffer = await res.arrayBuffer();
    const s3Path = await Uploader.putInvestmentCapitalAccount(
      investment._id,
      buffer,
      timeStamp,
      "Capital Account Statement"
    );

    await db.investments.updateOne(
      { _id: ObjectId(investment._id) },
      {
        $push: {
          documents: `${s3Path}`,
        },
      }
    );
    return datasources.investments.getInvestmentById({
      investment_id: ObjectId(investment._id),
    });
  },

  /** updates investments that correspond to a user_id **/
  updateInvestmentUserId: async (
    _,
    { investment_user_id, new_user_id },
    ctx
  ) => {
    try {
      await ctx.db.investments.updateMany(
        { user_id: ObjectId(investment_user_id) },
        { $set: { user_id: ObjectId(new_user_id) } }
      );
    } catch (err) {
      throwApolloError(err, "updateInvestmentUserId");
    }
  },
};

module.exports = Mutations;
