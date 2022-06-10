const { ObjectId } = require("mongodb");
const moment = require("moment");
const fetch = require("node-fetch");
const { get } = require("lodash");
const { isAdmin } = require("../permissions");
const { UserInputError } = require("apollo-server-express");
const Cloudfront = require("../../cloudfront");
const Uploader = require("../../uploaders/investor-docs");
const Investments = require("../schema/investments");
const {
  getInvestmentPreview,
  getTemplate,
  createCapitalAccountDoc,
  createInvestmentWireInstructions,
} = require("../../docspring");
const Mailer = require("../../mailers/mailer");
const commitmentTemplate = require("../../mailers/templates/commitment-template");
const commitmentCancelledTemplate = require("../../mailers/templates/commitment-cancelled-template");
const { signedSPV } = require("../../zaps/signedDocs");
const { customInvestmentPagination } = require("../pagHelpers");
const { DealService } = require("@allocations/deal-service");
const { sendWireReminderEmail } = require("../../mailers/wire-reminder");
const { amountFormat, throwApolloError } = require("../../utils/common");
const {
  ReferenceNumberService,
} = require("@allocations/reference-number-service");

const Schema = Investments;

const Investment = {
  deal: (investment, _, { datasources }) => {
    return datasources.deals.getDealById({ deal_id: investment.deal_id });
  },
  investor: (investment, _, { db }) => {
    return db.collection("users").findOne({ _id: investment.user_id });
  },
  documents: (investment) => {
    if (Array.isArray(investment.documents)) {
      return investment.documents.map((path) => {
        return { link: Cloudfront.getSignedUrl(path), path };
      });
    } else {
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

const Queries = {
  investment: (_, args, ctx) => {
    return ctx.datasources.investments.getInvestmentById({
      investment_id: ObjectId(args._id),
    });
  },
  investmentsList: async (_, args, ctx) => {
    isAdmin(ctx);
    const { pagination, currentPage } = args.pagination;
    const documentsToSkip = pagination * currentPage;
    const aggregation = customInvestmentPagination(args.pagination);
    const countAggregation = [...aggregation, { $count: "count" }];

    const investmentsCount = await ctx.db
      .collection("investments")
      .aggregate(countAggregation)
      .toArray();
    const count = investmentsCount.length ? investmentsCount[0].count : 0;

    let investments = await ctx.db
      .collection("investments")
      .aggregate(aggregation)
      .skip(documentsToSkip)
      .limit(pagination)
      .toArray();
    return { count, investments };
  },

  allInvestmentsByUserId: async (_, { q }, ctx) => {
    return ctx.db.collection("users").find({ q }).toArray();
  },
};

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

    return newInvestment;
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

      const signDeadline = get(deal, "dealParams.signDeadline");
      const status = get(deal, "status");

      if (deal !== null && deal.isDemo === true) {
        // needs to be a 24 character hex
        return { _id: "000000000000000000000000" };
      } else if (signDeadline) {
        const isClosed = status === "closed";
      }

      let investment = null;

      //grab reference number object, set to null value if undefined
      const referenceNumber = await ReferenceNumberService.assign({
        deal_id: payload.dealId,
      });

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
        // if there is a bankingProvider on the deal AND
        // a reference number was assigned to the investment
        // add the wire_instructions to the investment
        if (deal.bankingProvider && referenceNumber?.number) {
          newInvestmentData.wire_instructions = {
            // no dynamic data for acc/routing numbers yet
            account_number: null,
            routing_number: null,
            reference_number: referenceNumber?.number || null,
            // no dynamic data for provider yet
            provider: deal.bankingProvider || null,
          };
        }
        const { insertedId } = await datasources.investments.createInvestment({
          deal,
          user,
          investment: newInvestmentData,
        });

        investment = await db.investments.findOne({
          _id: ObjectId(insertedId),
        });
        // If bankingProvider AND referenceNumber create wire instructions PDF
        if (referenceNumber?.number && deal?.bankingProvider) {
          //create wire instructions, and return key for AWS integration
          const wireKey = await createInvestmentWireInstructions({
            providerName: deal?.bankingProvider,
            investmentId: investment._id,
            investorName: investment.submissionData.legalName,
            spvName: deal.company_name,
            referenceNumber: referenceNumber.number,
          });
          //update investment to include s3Key for docuspring integration
          await db.investments.updateOne(
            { _id: ObjectId(investment._id) },
            { $set: { "wire_instructions.s3Key": wireKey } }
          );
        }
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

  cancelCommitment: async (_, { _id, reason }, { user, db, ctx }) => {
    try {
      const investment = await ctx.datasources.investments.getInvestmentById({
        investment_id: ObjectId(_id),
      });
      if (!investment) return false;

      const deal = await db.deals.findOne({
        _id: ObjectId(investment.deal_id),
      });
      let res = await db.investments.deleteOne.deleteOne({
        _id: ObjectId(_id),
      });

      const emailData = {
        mainData: {
          to: user.email,
          from: "support@allocations.com",
          subject: `Commitment Cancelled`,
        },
        template: commitmentCancelledTemplate,
        templateData: {
          username: user.first_name ? `${user.first_name}` : user.email,
          issuer: deal.company_name || "",
          reason,
          refundAmount: `$${investment.amount}`,
          refundDate: moment(new Date()).add(2, "days").format("MMM DD, YYYY"),
        },
      };

      await Mailer.sendEmail(emailData);
      return res.deletedCount === 1;
    } catch (e) {
      return false;
    }
  },

  sendWireReminders: async (_, { investment_ids, deal_id }, { db }) => {
    try {
      const deal = await db
        .collection("deals")
        .findOne({ _id: ObjectId(deal_id) });
      const org = await db
        .collection("organizations")
        .findOne({ _id: ObjectId(deal.organization) });

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

module.exports = {
  Schema,
  Queries,
  Mutations,
  subResolvers: { Investment },
};
