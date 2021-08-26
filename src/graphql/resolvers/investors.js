const { ObjectId } = require("mongodb");
const { UserInputError } = require("apollo-server-express");
const {
  isAdmin,
  isAdminOrSameUser,
  ensureFundAdmin,
} = require("../permissions");
const { pick, isEmpty } = require("lodash");
const { AuthenticationError } = require("apollo-server-express");
const Cloudfront = require("../../cloudfront");
const Uploader = require("../../uploaders/investor-docs");
const {
  makeEnvelopeDef,
  createEnvelope,
  makeRecipientViewRequest,
  createRecipientView,
  getKYCTemplateId,
} = require("../../utils/docusign");
const { createTaxDocument } = require("../../docspring/index");
const { customUserPagination } = require("../pagHelpers");
const Users = require("../schema/users");
const fetch = require("node-fetch");

const Schema = Users;

const User = {
  /** invited deal show deal info based on ctx (if invited) **/
  invitedDeal: async (user, { deal_slug, fund_slug }, ctx) => {
    const fund = await ctx.db.organizations.findOne({ slug: fund_slug });

    // if fund admin or superadmin -> show
    // if (isFundAdmin(fund_slug, ctx.user) || ctx.user.admin) {
    //   return ctx.db.deals.findOne({ slug: deal_slug, organization: fund._id })
    // } else {
    // otherwise make sure they are invited!
    const deal = await ctx.db.deals.findOne({
      slug: deal_slug,
      organization: fund._id,
      // invitedInvestors: ObjectId(user._id)
    });
    if (deal) return deal;
    throw new AuthenticationError("REDIRECT");
    // }
  },
  investments: (user, _, { db }) => {
    return db.investments.find({ user_id: user._id }).toArray();
  },
  dealInvestments: (user, { deal_id }, { db }) => {
    return db.investments
      .find({ user_id: user._id, deal_id: ObjectId(deal_id) })
      .toArray();
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
  deals: async (user, _, { db }) => {
    const deals = await Promise.all(
      (user.organizations_admin || []).map((org) => {
        return db.deals.find({ organization: ObjectId(org) }).toArray() || [];
      })
    );

    return deals.reduce((acc, org) => [...acc, ...org], []);
  },

  accountInvestments: async (user, _, { db }) => {
    const account = await db.accounts.findOne({
      $or: [{ rootAdmin: ObjectId(user._id) }, { users: ObjectId(user._id) }],
    });
    if (!account) {
      return await db.investments
        .find({
          user_id: user._id,
        })
        .toArray();
    }
    const investments = await db.investments
      .find({
        $or: [
          {
            user_id: {
              $in: [...(account.users || []).map((u) => ObjectId(u))],
            },
          },
          { user_id: ObjectId(account.rootAdmin) },
        ],
      })
      .toArray();
    return investments;
  },
  account: async (user, _, { db }) => {
    const account = await db.accounts.findOne({ _id: ObjectId(user.account) });
    return account;
  },
  investorPersonalInfo: async (_, args, ctx) => {
    const { db, user } = ctx;
    let userInvesments = await db.investments
      .find({ user_id: user._id })
      .toArray();
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
        .filter((d) => d && d.submissionId && d.submissionId.includes("sub"))
        .map((d) => ({
          link: `app.docspring.com/submissions/${d.submissionId}/download`,
          name: d.documentName,
        })) || [];
    return docs;
  },
};

const Queries = {
  /** admin or investor themselves can query **/
  investor: async (_, args, ctx) => {
    const query = args._id
      ? { _id: ObjectId(args._id) }
      : { email: ctx.user.email };

    return ctx.db.collection("users").findOne(query);
  },
  allInvestors: (_, args, ctx) => {
    isAdmin(ctx);
    return ctx.db.collection("users").find({}).toArray();
  },
  allUsers: async (_, args, ctx) => {
    isAdmin(ctx);
    const { pagination, currentPage } = args.pagination;

    const documentsToSkip = pagination * currentPage;
    const aggregation = customUserPagination(args.pagination);
    const countAggregation = [...aggregation, { $count: "count" }];
    const usersCount = await ctx.db
      .collection("users")
      .aggregate(countAggregation)
      .toArray();
    const count = usersCount.length ? usersCount[0].count : 0;

    let users = await ctx.db
      .collection("users")
      .aggregate(aggregation)
      .skip(documentsToSkip)
      .limit(pagination)
      .toArray();

    users = users.map((item) => item.user);

    return { count, users };
  },
  searchUsers: async (_, { org, q }, ctx) => {
    const orgRecord = await ensureFundAdmin(org, ctx);

    const searchQ = {
      $or: [
        { first_name: { $regex: new RegExp(q), $options: "i" } },
        { last_name: { $regex: q, $options: "i" } },
        { entity_name: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
      ],
    };
    const orgCheck = ctx.user.admin ? {} : { organizations: orgRecord._id };

    return ctx.db
      .collection("users")
      .find({
        ...orgCheck,
        ...searchQ,
      })
      .toArray();
  },
  getLink: async (_, data, ctx) => {
    const accountId = process.env.DOCUSIGN_ACCOUNT_ID;
    const newUserData = pick(data.input, [
      "dob",
      "street_address",
      "city",
      "state",
      "zip",
      "mail_country",
      "mail_city",
      "mail_zip",
      "mail_state",
      "mail_street_address",
    ]);

    const templateData = await getKYCTemplateId({
      input: data.input,
      accountId,
    });

    const envelopeDefinition = await makeEnvelopeDef({
      user: { ...ctx.user, ...data.input, _id: ctx.user._id },
      templateId: templateData.templateId,
      formName: templateData.formType,
    });

    const { envelopeId } = await createEnvelope({
      envelopeDefinition,
      accountId,
    });

    const viewRequest = await makeRecipientViewRequest({
      user: { ...ctx.user, ...data.input, _id: ctx.user._id },
      dsPingUrl: process.env.DS_APP_URL,
      dsReturnUrl: process.env.DS_APP_URL,
      envelopeId,
      accountId,
    });

    const view = await createRecipientView({
      envelopeId,
      viewRequest,
      accountId,
    });
    if (templateData.formType !== "Provision Of Services") {
      await ctx.db.users.updateOne(
        { _id: ObjectId(ctx.user._id) },
        { $set: { ...newUserData, dob: newUserData.dob.slice(0, 4) } }
      );
    }
    return { redirectUrl: view.redirectUrl, formName: templateData.formType };
  },
};

const Mutations = {
  /** creates investor w/ created_at **/
  createInvestor: async (_, { user }, ctx) => {
    isAdmin(ctx);

    const res = await ctx.db
      .collection("users")
      .insertOne({ ...user, created_at: Date.now() });
    return res.ops[0];
  },
  /** updates user and handles file uploads **/
  updateUser: async (
    _,
    { input: { _id, passport, accredidation_doc, kycDoc, ...user } },
    ctx
  ) => {
    isAdminOrSameUser({ _id }, ctx);

    // upload passport if passed
    if (passport && !passport.link) {
      const file = await passport;
      const s3Path = await Uploader.putInvestorDoc(_id, file, "passport");
      return ctx.db.users.updateOne(
        { _id: ObjectId(_id) },
        { $set: { ...user, passport: s3Path } }
      );
    }

    if (kycDoc) {
      return ctx.db.users.updateOne(
        { _id: ObjectId(_id) },
        { $addToSet: { documents: kycDoc } }
      );
    }

    // upload accredidation_doc if passed
    if (accredidation_doc && !accredidation_doc.link) {
      const file = await accredidation_doc;
      const s3Path = await Uploader.putInvestorDoc(
        _id,
        file,
        "accredidation_doc"
      );

      return ctx.db.users.updateOne(
        { _id: ObjectId(_id) },
        { $set: { ...user, accredidation_doc: s3Path } }
      );
    }
    const options = [
      "investor_type",
      "country",
      "state",
      "first_name",
      "last_name",
      "entity_name",
      "signer_full_name",
      "accredited_investor_status",
      "email",
      "accountId",
      "accredidation_status",
    ];
    const data = pick({ ...user }, options);
    if (!isEmpty(data)) {
      await ctx.db.entities.updateOne(
        { user: ObjectId(_id), isPrimaryEntity: true },
        { $set: data }
      );
    }
    await ctx.db.users.updateOne({ _id: ObjectId(_id) }, { $set: user });

    return await ctx.db.users.findOne({ _id: ObjectId(_id) });
  },
  /** deletes investor -> TODO delete their investment as well **/
  deleteInvestor: async (_, { _id }, ctx) => {
    isAdmin(ctx);

    try {
      const res = await ctx.db.users.deleteOne({ _id: ObjectId(_id) });
      return res.deletedCount === 1;
    } catch (e) {
      return false;
    }
  },
  submitTaxDocument: async (_, { payload }, { db, user }) => {
    if (payload.isDemo) {
      return db.users.findOne({ _id: ObjectId(user._id) });
    }

    const { kycTemplateId, kycTemplateName } = payload;
    const isAllocationsUser = user.email.includes("@allocations.com;");

    if (process.env.NODE_ENV === "production" && !isAllocationsUser) {
      // TODO: move to zaps
      fetch("https://hooks.zapier.com/hooks/catch/7904699/byt3rnq/", {
        method: "POST",
        body: JSON.stringify({ ...payload, kycTemplateId, kycTemplateName }),
      });
    }

    const taxDocument = await createTaxDocument({ payload, user, db });
    if (!taxDocument)
      throw new UserInputError("There was an error with Docspring");

    return db.users.findOne({ _id: ObjectId(user._id) });
  },

  addProfileImage: async (_, { email, image, linkedinUrl }, { db, user }) => {
    const foundUser = await db.users.findOne({ email });
    if (!foundUser) {
      throw new Error("no user found!");
    }
    const file = await image;
    const key = await Uploader.putInvestorProfileImage(
      foundUser._id,
      file,
      "profileImage"
    );
    await db.users.updateOne(
      { _id: ObjectId(foundUser._id) },
      { $set: { profileImageKey: key, linkedinUrl } }
    );
    return foundUser;
  },
};

module.exports = {
  Schema,
  Queries,
  Mutations,
  subResolvers: { User },
};
