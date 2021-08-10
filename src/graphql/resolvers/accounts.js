const { ObjectId } = require("mongodb");
const { isAdmin } = require("../permissions");
const Accounts = require("../schema/accounts");
const AccountMailer = require("../../mailers/account-invite-mailer");

const Schema = Accounts;

const Account = {};

const Queries = {
  accountUsers: async (_, { _id }, { user, db }) => {
    // update here to OR query
    const account = await db.accounts.findOne({ _id: ObjectId(user.account) });
    if (!account) {
      return [];
    }
    const users = await db.users
      .find({
        _id: {
          $in: ([...(account.users || []), account.rootAdmin] || []).map((u) =>
            ObjectId(u)
          ),
        },
      })
      .toArray();
    return users;
  },
  rootAdmin: async (_, { _id }, { user, db }) => {
    // update here to OR query
    const account = await db.accounts.findOne({
      $or: [{ rootAdmin: ObjectId(user._id) }, { users: ObjectId(user._id) }],
    });
    if (!account) {
      return null;
    }
    return account.rootAdmin;
  },
  accountId: async (_, { _id }, { user, db }) => {
    // update here to OR query
    const account = await db.accounts.findOne({
      $or: [{ rootAdmin: ObjectId(user._id) }, { users: ObjectId(user._id) }],
    });
    if (!account) {
      return null;
    }
    return account._id;
  },
};

const Mutations = {
  sendAccountInvite: async (_, { payload }, { user, db }) => {
    console.log("SENT", user.account);
    const invite = await AccountMailer.sendInvite({
      sender: { ...user, accountId: user.account },
      to: payload.newUserEmail,
    });

    return invite;
    // throw new AuthenticationError('permission denied');
  },
  confirmInvitation: async (_, { accountId }, { user, db }) => {
    let confirmed = false;
    console.log("RECEIEVED", accountId);

    const account = await db.accounts.findOne({ _id: ObjectId(accountId) });
    if (account._id) {
      confirmed = true;
      // Update User to new Account ID
      const updatedUser = await db.users.updateOne(
        { _id: ObjectId(user._id) },
        {
          $set: { account: ObjectId(account._id) },
        }
      );
      // Update All Entities to new Account ID
      const updatedEntities = await db.entities.updateMany(
        { user: ObjectId(user._id) },
        {
          $set: {
            accountId: ObjectId(account._id),
          },
        }
      );
      // Update the Account to include the user
      const updatedAcct = await db.accounts.updateOne(
        { _id: ObjectId(accountId) },
        { $push: { users: user._id } }
      );
    }

    return confirmed;
  },
  removeAcctUser: async (_, { accountId, userId }, ctx) => {
    isAdmin(ctx);
    const originalAccount = await ctx.db.accounts.findOne({
      rootAdmin: ObjectId(userId),
    });
    console.log("ACCOUNT", originalAccount);
    try {
      const res = await ctx.db.accounts.update(
        { _id: ObjectId(accountId) },
        {
          $pull: {
            users: ObjectId(userId),
          },
        }
      );

      // reset user info back to base account
      await ctx.db.users.updateOne(
        { _id: ObjectId(userId) },
        {
          $set: { account: ObjectId(originalAccount._id) },
        }
      );

      // Update All Entities to new Account ID
      await ctx.db.entities.updateMany(
        { user: ObjectId(userId) },
        {
          $set: {
            accountId: ObjectId(originalAccount._id),
          },
        }
      );
      return true;
    } catch (e) {
      console.log(e);
      return false;
    }
  },
};

module.exports = {
  Schema,
  Queries,
  Mutations,
  subResolvers: { Account },
};
