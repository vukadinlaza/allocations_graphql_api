const { isAdmin, isOrgAdmin } = require('../graphql/permissions')
const { gql } = require('apollo-server-express')

const Schema = gql`
  type SuperAdmin {
    deals: [Deal]
    investors: [User]
    organizations: [Organization]
  }

  extend type Query {
    superadmin: SuperAdmin
  }
`

const Queries = {
  superadmin: (_, __, ctx) => {
    isAdmin(ctx)
    return {}
  }
}

const SuperAdmin = {
  deals: (_, __, { db }) => {
    return db.deals.find().sort({ created_at: -1 }).toArray()
  },
  investors: (_, __, { db }) => {
    return db.users.find().sort({ created_at: -1 }).toArray()
  },
  organizations: (_, __, { db }) => {
    return db.organizations.find().sort({ created_at: -1 }).toArray()
  }
}

module.exports = { SuperAdmin, Queries, Schema }