const { ObjectId } = require("mongodb");
const { isAdmin, isOrgAdmin } = require("../../permissions");
const PublicUploader = require("../../../uploaders/public-docs");
const AdminMailer = require("../../../mailers/admin-mailer");
const { throwApolloError } = require("../../../utils/common");

const Mutations = {
  /** creates org and adds the creator to the fund automatically  **/
  createOrganization: async (
    _,
    { organization: { logo, ...organization } },
    ctx
  ) => {
    try {
      isAdmin(ctx);

      // upload logo
      if (logo) {
        await PublicUploader.upload({
          doc: logo,
          path: `organizations/${organization.slug}.png`,
        });
      }

      // make slug unique from any other organization
      const slug = `${organization.name.split(" ").join("-")}-${Date.now()}`;

      const { insertedId: _id } = await ctx.db.organizations.insertOne({
        ...organization,
        slug,
        created_at: Date.now(),
      });

      // add user to org admin
      await ctx.db.users.updateOne(
        { _id: ctx.user._id },
        { $push: { organizations_admin: _id } }
      );
      return { ...organization, slug, _id };
    } catch (err) {
      throwApolloError(err, "createOrganization");
    }
  },
  /** simple update **/
  updateOrganization: async (
    _,
    { organization: { _id, slug, ...organization } },
    ctx
  ) => {
    isOrgAdmin(_id, { user: ctx.user });
    const updatedOrg = await ctx.db.organizations.findOneAndUpdate(
      { _id: ObjectId(_id) },
      { $set: { ...organization, slug, updated_at: Date.now() } },
      { returnDocument: "after" }
    );
    return updatedOrg.value;
  },
  /** add member to org **/
  addOrganizationMembership: async (_, { slug, user_id }, ctx) => {
    isAdmin(ctx);
    const { _id } = await ctx.db.organizations.findOne({ slug });
    return ctx.db.users.updateOne(
      { _id: ObjectId(user_id) },
      { $push: { organizations_admin: _id } }
    );
  },
  /** rm member from org **/
  revokeOrganizationMembership: async (_, { slug, user_id }, ctx) => {
    isAdmin(ctx);
    const { _id } = await ctx.db.organizations.findOne({ slug });
    return ctx.db.users.updateOne(
      { _id: ObjectId(user_id) },
      { $pull: { organizations_admin: _id } }
    );
  },
  /** sends invite, mail and db **/
  sendAdminInvite: async (_, { slug, user_id }, ctx) => {
    isAdmin(ctx);

    const org = await ctx.db.organizations.findOne({ slug });
    const { email } = await ctx.db.users.findOne({ _id: ObjectId(user_id) });
    const invite = await AdminMailer.sendInvite({ org, to: email });

    await ctx.db.organizations.updateOne(
      { slug },
      { $push: { adminInvites: invite } }
    );
    return invite;
  },
};

module.exports = {
  Mutations,
};
