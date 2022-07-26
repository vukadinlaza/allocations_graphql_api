const { ObjectId } = require("mongodb");
const { UserInputError } = require("apollo-server-express");
const { isAdmin, isAdminOrSameUser } = require("../../permissions");
const { pick, isEmpty } = require("lodash");
const Uploader = require("../../../uploaders/investor-docs");
const { createTaxDocument } = require("../../../docspring/index");
const fetch = require("node-fetch");
const { throwApolloError } = require("../../../utils/common");

const Mutations = {
  /** creates investor w/ created_at **/
  createUser: async (_, { user }, ctx) => {
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
        "sectors",
        "stages",
        "linkedinUrl",
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
  deleteUser: async (_, { _id }, ctx) => {
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

  //TO BE DELETED AUG 4th 2022
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
};

module.exports = Mutations;
