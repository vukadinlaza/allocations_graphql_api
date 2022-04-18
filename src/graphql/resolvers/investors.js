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
const {
  customUserPagination,
  customFundManagerAggregation,
  customAdminAggregation,
} = require("../pagHelpers");
const Users = require("../schema/users");
const fetch = require("node-fetch");
const { throwApolloError } = require("../../utils/common");

const Schema = Users;

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
  investments: (user, _, { datasources }) => {
    return datasources.investments.getAllInvestments({
      user_id: ObjectId(user._id),
    });
  },
  dealInvestments: (user, { deal_id }, { datasources }) => {
    return datasources.investments.getAllInvestments({
      user_id: ObjectId(user._id),
      deal_id: ObjectId(deal_id),
    });
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

  accountInvestments: async (user, _, { db, ctx }) => {
    const account = await db.accounts.findOne({
      $or: [{ rootAdmin: ObjectId(user._id) }, { users: ObjectId(user._id) }],
    });
    if (!account) {
      return await ctx.datasources.investments.getAllInvestments({
        user_id: user._id,
      });
    }
    const investments = await ctx.datasources.investments.getAllInvestments({
      $or: [
        {
          user_id: {
            $in: [...(account.users || []).map((u) => ObjectId(u))],
          },
        },
        { user_id: ObjectId(account.rootAdmin) },
      ],
    });
    return investments;
  },
  account: async (user, _, { db }) => {
    const account = await db.accounts.findOne({ _id: ObjectId(user.account) });
    return account;
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
    const aggregation = customUserPagination(
      args.pagination,
      args.additionalFilter
    );
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
  allUsersWithInvestmentsCount: async (_, args, ctx) => {
    const { pagination, currentPage } = args.pagination;
    const documentsToSkip = pagination * currentPage;

    let aggregation;

    if (!ctx.user.admin) {
      aggregation = customFundManagerAggregation(
        args.pagination,
        args.additionalFilter,
        ctx.user._id
      );
    } else {
      isAdmin(ctx);
      aggregation = customAdminAggregation(
        args.pagination,
        args.additionalFilter
      );
    }
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

  investorsLookupById: (_, { userIds }, ctx) => {
    isAdmin(ctx);

    const objectIds = userIds.map((id) => ObjectId(id));
    return ctx.db
      .collection("users")
      .find({ _id: { $in: objectIds } })
      .toArray();
  },

  searchUsersByEmail: async (_, { q }, ctx) => {
    const userOne = q[0];
    const userTwo = q[1];

    const searchQ = {
      $or: [
        { email: { $regex: userOne, $options: "i" } },
        { email: { $regex: userTwo, $options: "i" } },
      ],
    };

    const users = await ctx.db
      .collection("users")
      .find({
        ...searchQ,
      })
      .toArray();

    return users;
  },
};

const Mutations = {
  /** creates investor w/ created_at **/
  createInvestor: async (_, { user }, ctx) => {
    isAdmin(ctx);

    const { insertedId } = await ctx.db
      .collection("users")
      .insertOne({ ...user, created_at: Date.now() });

    const newUser = await ctx.db
      .collection("users")
      .findOne({ _id: ObjectId(insertedId) });
    return newUser;
  },
  /** updates user and handles file uploads **/
  updateUser: async (
    _,
    { input: { _id, passport, accredidation_doc, kycDoc, ...user } },
    ctx
  ) => {
    try {
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
        "display_username",
        "linkedinUrl",
        "username",
        "city",
        "profileBio",
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
    } catch (err) {
      throwApolloError(err, "updateUser");
    }
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
    try {
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
    } catch (err) {
      throwApolloError(err, "submitTaxDocument");
    }
  },

  addProfileImage: async (_, { email, image }, { db }) => {
    const foundUser = await db.users.findOne({ email });
    if (!foundUser || foundUser === null) {
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
      { $set: { profileImageKey: key } }
    );
    return foundUser;
  },

  updateProfileImage: async (_, { email, image }, { db }) => {
    try {
      const foundUser = await db.users.findOne({ email });
      if (!foundUser || foundUser === null) {
        throw new Error("no user found!");
      }

      const imgKey = `${Date.now()}-profileImage`;
      const file = await image;
      const key = await Uploader.putInvestorProfileImage(
        foundUser._id,
        file,
        imgKey
      );
      await db.users.updateOne(
        { _id: ObjectId(foundUser._id) },
        { $set: { profileImageKey: key } }
      );
      return { ...foundUser, profileImageKey: key };
    } catch (err) {
      throwApolloError(err, "updateProfileImage");
    }
  },

  addSectors: async (_, { email, sector }, { db }) => {
    const foundUser = await db.users.findOne({ email });
    if (!foundUser || foundUser === null) {
      throw new Error("no user found!");
    }
    await db.users.updateOne(
      { _id: ObjectId(foundUser._id) },
      { $addToSet: { sectors: sector } }
    );

    return db.users.findOne({ email });
  },

  deleteSectors: async (_, { email, sector }, { db }) => {
    const foundUser = await db.users.findOne({ email });
    if (!foundUser || foundUser === null) {
      throw new Error("no user found!");
    }
    await db.users.updateOne(
      { _id: ObjectId(foundUser._id) },
      { $pull: { sectors: sector } }
    );

    return db.users.findOne({ email });
  },

  addStages: async (_, { email, stage }, { db }) => {
    const foundUser = await db.users.findOne({ email });
    if (!foundUser || foundUser === null) {
      throw new Error("no user found!");
    }
    await db.users.updateOne(
      { _id: ObjectId(foundUser._id) },
      { $addToSet: { stages: stage } }
    );

    return db.users.findOne({ email });
  },

  deleteStages: async (_, { email, stage }, { db }) => {
    const foundUser = await db.users.findOne({ email });
    if (!foundUser || foundUser === null) {
      throw new Error("no user found!");
    }
    await db.users.updateOne(
      { _id: ObjectId(foundUser._id) },
      { $pull: { stages: stage } }
    );

    return db.users.findOne({ email });
  },

  deleteProfileImage: async (_, { email, profileImageKey }, { db }) => {
    try {
      const foundUser = await db.users.findOne({ email });
      if (!foundUser || foundUser === null) {
        throw new Error("no user found!");
      }
      await db.users.updateOne(
        { _id: ObjectId(foundUser._id) },
        { $unset: { profileImageKey: profileImageKey } }
      );

      return db.users.findOne({ email });
    } catch (err) {
      throwApolloError(err, "deleteProfileImage");
    }
  },

  displayUsernameStatus: async (_, { email, display_username }, { db }) => {
    const foundUser = await db.users.findOne({ email });
    if (!foundUser || foundUser === null) {
      throw new Error("no user found!");
    }
    await db.users.updateOne(
      { _id: ObjectId(foundUser._id) },
      { $set: { display_username: display_username } }
    );
  },

  addFirstAndLastName: async (_, { email, first_name, last_name }, { db }) => {
    const foundUser = await db.users.findOne({ email });
    if (!foundUser || foundUser === null) {
      throw new Error("no user found!");
    }
    await db.users.updateOne(
      { _id: ObjectId(foundUser._id) },
      { $set: { first_name: first_name, last_name: last_name } }
    );

    return db.users.findOne({ email });
  },

  updateInvestorLinkedin: async (_, { email, linkedinUrl }, { db }) => {
    const foundUser = await db.users.findOne({ email });
    if (!foundUser || foundUser === null) {
      throw new Error("no user found!");
    }
    await db.users.updateOne(
      { _id: ObjectId(foundUser._id) },
      { $set: { linkedinUrl: linkedinUrl } }
    );

    return db.users.findOne({ email });
  },

  /** updates accounts that want to be merged **/
  mergeAccounts: async (_, { payload }, { db }) => {
    try {
      const { updatedOrganizations, updatedInvestments } = payload;
      if (updatedOrganizations) {
        const user = await db.users.findOne({
          _id: ObjectId(updatedOrganizations.user_id),
        });
        const newUserOrgs = [
          ...new Set([
            ...(user.organizations_admin?.map((o) => o.toString()) || []),
            ...updatedOrganizations.organizations,
          ]),
        ].map((o) => ObjectId(o));

        await db.users.update(
          { _id: ObjectId(updatedOrganizations.user_id) },
          {
            $set: {
              organizations_admin: newUserOrgs,
            },
          }
        );
        await db.users.update(
          { _id: ObjectId(updatedOrganizations.previous_user_id) },
          {
            $set: {
              organizations_admin: [],
            },
          }
        );
      }

      if (updatedInvestments) {
        await db.investments.updateMany(
          {
            _id: {
              $in: updatedInvestments.investments?.map((inv) => ObjectId(inv)),
            },
          },
          { $set: { user_id: ObjectId(updatedInvestments.user_id) } }
        );
      }

      return { updated: true };
    } catch (err) {
      throwApolloError(err, "mergeAccounts");
    }
  },
};

module.exports = {
  Schema,
  Queries,
  Mutations,
  subResolvers: { User },
};
