const { ObjectId } = require("mongodb")
const { isNumber, pick, create } = require('lodash')
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
		console.log(accountId)
		const entities = await db.entities.find({ accountId: ObjectId(accountId) }).toArray()
		return entities
	},
}

const Mutations = {
	createEntity: async (_, { payload }, { user, db }) => {
		const options = ['investor_type', 'country', 'state', 'first_name', 'last_name', 'entity_name', 'signer_full_name', 'accredited_investor_status', 'email', 'accountId']
		const data = pick(payload, options)
		console.log(payload)

		const createdEntity = await db.entities.insertOne({ ...data, accountId: ObjectId(payload.accountId) })
		return createdEntity.ops[0]
	},

}

module.exports = {
	Schema,
	Queries,
	Mutations,
	subResolvers: { Entity }
}
