const { ObjectId } = require("mongodb")
const { isNumber } = require('lodash')
const { isAdmin, isAdminOrSameUser } = require('../permissions')
const { AuthenticationError } = require('apollo-server-express')
const Cloudfront = require('../../cloudfront')
const Uploader = require('../../uploaders/investor-docs')
const Accounts = require('../schema/accounts')
const AccountMailer = require('../../mailers/account-invite-mailer')



/** 

  handles all the account flow

 **/

const Schema = Accounts

const Account = {

}

const Queries = {
	accountUsers: async (_, { _id }, { user, db }) => {
		// update here to OR query
		const account = await db.accounts.findOne({ $or: [{ rootAdmin: ObjectId(user._id) }, { users: ObjectId(user._id) }] })
		const users = await db.users.find({
			_id: {
				$in: (account.users || []).map(u => ObjectId(u))
			}
		}).toArray()
		return users
	},
	rootAdmin: async (_, { _id }, { user, db }) => {
		// update here to OR query
		const account = await db.accounts.findOne({ $or: [{ rootAdmin: ObjectId(user._id) }, { users: ObjectId(user._id) }] })
		return account.rootAdmin
	},
	accountId: async (_, { _id }, { user, db }) => {
		// update here to OR query
		const account = await db.accounts.findOne({ $or: [{ rootAdmin: ObjectId(user._id) }, { users: ObjectId(user._id) }] })
		return account._id
	},
}

const Mutations = {
	sendAccountInvite: async (_, { payload }, { user, db }) => {
		const account = await db.accounts.findOne({ rootAdmin: user._id })
		let accountId = null
		if (!account) {
			const res = await db.accounts.insertOne({
				rootAdmin: user._id,
			})
			const acct = res.ops[0]
			accountId = acct._id
		}
		if (account._id) {
			accountId = account._id
		}
		const invite = await AccountMailer.sendInvite({ sender: { ...user, accountId }, to: payload.newUserEmail })

		return invite
		// throw new AuthenticationError('permission denied');
	},
	confirmInvitation: async (_, { accountId }, { user, db }) => {
		let confirmed = false
		const account = await db.accounts.findOne({
			$or: [{
				rootAdmin: user._id,
				users: {
					$in: [user._id]
				}
			}]
		})
		if (account) {
			confirmed = true
		}
		if (!account) {
			const updatedAcct = await db.accounts.updateOne(
				{ _id: ObjectId(accountId) },
				{ $push: { users: user._id } }
			)
			confirmed = true

		}

		return confirmed
	},
	removeAcctUser: async (_, { accountId, userId }, ctx) => {
		console.log(accountId, userId)
		isAdmin(ctx)

		try {
			const res = await ctx.db.accounts.update(
				{ _id: ObjectId(accountId) },
				{
					$pull: {
						users: ObjectId(userId)
					}
				}
			);
			console.log(res)
			return true
		} catch (e) {
			console.log(e)
			return false
		}
	},
}

module.exports = {
	Schema,
	Queries,
	Mutations,
	subResolvers: { Account }
}
