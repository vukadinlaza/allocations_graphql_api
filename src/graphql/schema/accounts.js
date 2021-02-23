const { gql } = require('apollo-server-express')

module.exports = gql(`
type Account {
  _id: String
  rootAdmin: User,
  users: [User]
}
extend type Query {
  accountUsers: [User]
  rootAdmin: String 
  accountId: String
}

extend type Mutation {
	sendAccountInvite(payload: Object): Object
  confirmInvitation(accountId: String): Boolean
  removeAcctUser(accountId: String, userId: String): Boolean
}
`)