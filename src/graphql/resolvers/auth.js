const { ObjectId } = require("mongodb")
const _ = require('lodash')
const { gql } = require('apollo-server-express')
const { isAdmin } = require('../permissions')
const logger = require('../../utils/logger')
const { AuthenticationError } = require('apollo-server-express')

const Schema = gql`
  extend type Mutation {
    signUp(inviteKey: String): User
  }
`

const Mutations = {
  signUp: async (_, { inviteKey }, { db, user }) => {
    // invite user to Deal if key correct
    if (inviteKey) {
      await db.deals.updateOne(
        { inviteKey: inviteKey },
        { $push: { invitedInvestors: ObjectId(user._id) } }
      )
    }
    return user     
  }
}

module.exports = { 
  Schema, 
  Mutations 
}
