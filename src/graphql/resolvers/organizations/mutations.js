const { ObjectId } = require("mongodb");
const { isAdmin, isOrgAdmin } = require("../../permissions");
const PublicUploader = require("../../../uploaders/public-docs");
const AdminMailer = require("../../../mailers/admin-mailer");
const { throwApolloError } = require("../../../utils/common");
const { requestBuild } = require("../../../utils/build-api");

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

      if (organization._id) {
        organization._id = new ObjectId(organization._id);
      }

      const { insertedId: _id } = await ctx.db.organizations.insertOne({
        ...organization,
        created_at: Date.now(),
      });

      // add user to org admin
      await ctx.db.users.updateOne(
        { _id: ctx.user._id },
        { $push: { organizations_admin: _id } }
      );
      return { ...organization, _id };
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
  updateServiceOrg: async (_, { organization, _id }, ctx) => {
    isAdmin(ctx);
    try {
      const response = await requestBuild(
        `/api/v1/organizations/${_id}`,
        "PUT",
        {
          name: organization.name,
          slug: organization.slug,
        }
      );

      if (response.error)
        throw new Error(`Organization wasnt updated: ${response.error}`);

      const entitiesResponse = await requestBuild(
        `/api/v1/entities?organization_ids=${_id}`
      );

      if (entitiesResponse.length && organization._id) {
        const { organization_ids } = entitiesResponse[0];
        const oldIdIndex = organization_ids.indexOf(_id);
        organization_ids.splice(oldIdIndex, 1, organization._id);
        const updatedEntitiesRes = await requestBuild(
          `/api/v1/entities/${entitiesResponse[0]._id}`,
          "PUT",
          { organization_ids }
        );
        if (updatedEntitiesRes.error) throw new Error("Entities wasnt updated");
      }

      const dealResponse = await requestBuild(
        `/api/v1/deals?organization_id=${_id}`
      );

      if (dealResponse.length) {
        dealResponse.forEach(async (deal) => {
          const updatedDealRes = await requestBuild(
            `/api/v1/deals/${deal._id}`,
            "PUT",
            {
              organization_id: organization._id,
              organization_name: organization.name,
            }
          );
          if (updatedDealRes.error)
            throw new Error(`Deal ${deal._id} wasnt updated`);
        });
      }

      return response;
    } catch (err) {
      return err;
    }
  },
};

module.exports = Mutations;
