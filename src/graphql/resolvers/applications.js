const { ObjectId } = require("mongodb")
const { sumBy } = require('lodash')
const { gql } = require('apollo-server-express')
const { isAdmin, isOrgAdmin, ensureFundAdmin } = require('../permissions')
const fetch = require('node-fetch');
const moment = require('moment')
const Applications = require('../schema/applications')

/**

  Handles all exchange related requests

 **/

 const Schema = Applications

 const Queries = {
   application: async (_, { _id }, { user, db }) => {
     const application = await db.applications.findOne({ _id: ObjectId(_id) })
     return application
   }
 }

const Mutations = {
  /** Add order w/ proper associations **/
  createApplication: async (_, { application }, ctx) => {
    console.log(application);
    const newApplication = await ctx.db.applications.insertOne(application)
    console.log({newApplication});
    return newApplication
  }
}

module.exports = {
  Schema,
  Queries,
  Mutations
}
