const { gql } = require("apollo-server-express");

module.exports = gql(`
type Entity {
	_id: String
	created_at: String
	investor_type: String
	country: String
	name: String
	first_name: String
	last_name: String
	entity_name: String
	signer_full_name: String
	accredited_investor_status: String
	email: String
	documents: [Object]
	passport: Document
	accredidation_doc: Document
	accredidation_status: Boolean
	accountId: Account
	user: User
	isPrimaryEntity: Boolean
}

input EntityInput {
	_id: String
	investor_type: String
	country: String
	first_name: String
	last_name: String
	entity_name: String
	signer_full_name: String
	accredited_investor_status: String
	email: String
  }

extend type Query {
  getEntity: Entity
  getEntities(accountId: String): [Entity]
}

extend type Mutation {
	createEntity(payload: Object): Object
	deleteEntity(accountId: String, entityId: String): Boolean
	updateEntity(payload: EntityInput): Entity
}
`);
