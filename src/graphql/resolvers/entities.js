const { ObjectId } = require("mongodb")
const { isNumber, pick, create, omit } = require('lodash')
const { isAdmin, isAdminOrSameUser } = require('../permissions')
const { AuthenticationError } = require('apollo-server-express')
const Cloudfront = require('../../cloudfront')
const Uploader = require('../../uploaders/investor-docs')
const Entities = require('../schema/entities')



/** 

  handles all the account flow

 **/

const Schema = Entities

const Entity = {

}

const Queries = {
	getEntity: async (_, { _id }, { user, db }) => {
	},
	getEntities: async (_, { accountId }, { user, db }) => {
		const entities = await db.entities.find({ accountId: ObjectId(accountId) }).toArray()
		return entities
	},
}

const Mutations = {
	createEntity: async (_, { payload }, { user, db }) => {
		console.log('FIRES', payload)
		const options = ['investor_type', 'country', 'state', 'first_name', 'last_name', 'entity_name', 'signer_full_name', 'accredited_investor_status', 'email', 'accountId']
		const data = pick(payload, options)

		const createdEntity = await db.entities.insertOne({ ...data, accountId: ObjectId(payload.accountId) })
		return createdEntity.ops[0]
	},
	deleteEntity: async (_, { entityId, accountId }, { user, db }) => {
		const res = await db.entities.deleteOne({ _id: ObjectId(entityId), accountId: ObjectId(accountId) })
		return res.deletedCount === 1

	},
	updateEntity: async (_, { payload }, { user, db }) => {
		return await db.entities.updateOne(
			{ _id: ObjectId(payload._id) },
			{ $set: { ...omit(payload, '_id') } },
			{ "new": true }
		)
	},


}

module.exports = {
	Schema,
	Queries,
	Mutations,
	subResolvers: { Entity }
}
