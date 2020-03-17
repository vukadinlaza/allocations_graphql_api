const { ApolloServer, gql, AuthenticationError } = require('apollo-server-express')
const { ObjectId } = require("mongodb")
const auth0 = require('auth0')
const { get } = require('lodash')
const { verify, authenticate } = require('../auth')
const { parse } = require('graphql')

const { isAdmin, isAdminOrSameUser, isOrgAdmin } = require('./permissions')
const Cloudfront = require('../cloudfront')
const Uploader = require('../uploaders/investor-docs')

const DealsResolver = require('../resolvers/deals')
const ExchangeResolver = require('../resolvers/exchange')
const InvestorsResolver = require('../resolvers/investors')
const InvestmentsResolver = require('../resolvers/investments')
const OrganizationsResolver = require('../resolvers/organizations')

const logger = require('../utils/logger')

const typeDefs = gql`
  type Document {
    path: String
    link: String
  }

  type Query {
    investment(_id: String): Investment
    
    allInvestors: [User]
    allInvestments: [Investment]

    publicDeal(company_name: String!, invite_code: String!): Deal
  }

  type Mutation {
    signUp(inviteKey: String): User
  }

  type File {
    filename: String!
    mimetype: String!
    encoding: String!
  }
`

function authedServer (db) {
  const resolvers = {
    Query: {
      ...DealsResolver.Queries,
      ...ExchangeResolver.Queries,
      ...InvestorsResolver.Queries,
      ...OrganizationsResolver.Queries,

      investment: (_, args, ctx) => {
        isAdmin(ctx)
        return db.collection("investments").findOne({ _id: ObjectId(args._id) })
      },

      publicDeal: async (_, { company_name, invite_code }) => {
        const deal = await db.collection("deals").findOne({ company_name })
        if (deal && deal.inviteKey === invite_code) {
          return deal
        }
        throw new AuthenticationError()
      },

      // admin API
      allInvestors: (_, args, ctx) => {
        isAdmin(ctx)
        return db.collection("users").find({}).toArray()
      },
      allInvestments: (_, __, ctx) => {
        isAdmin(ctx)
        return db.collection("investments").find({}).toArray()
      }
    },
    Deal: DealsResolver.Deal,
    User: InvestorsResolver.User,
    ExchangeDeal: ExchangeResolver.ExchangeDeal,
    MatchRequest: ExchangeResolver.MatchRequest,
    Investment: InvestmentsResolver.Investment,
    Organization: OrganizationsResolver.Organization,
    Mutation: {
      ...DealsResolver.Mutations,
      ...ExchangeResolver.Mutations,
      ...InvestorsResolver.Mutations,
      ...InvestmentsResolver.Mutations,
      ...OrganizationsResolver.Mutations,

      // inviteKey refers to a deal the user has been invited too
      signUp: async (_, { inviteKey }, ctx) => {
        const user = ctx.user
        // invite user to Deal if key correct
        if (inviteKey) {
          await db.collection("deals").updateOne(
            { inviteKey: inviteKey },
            { $push: { invitedInvestors: ObjectId(user._id) } }
          )
        }
        return user     
      }
    }
  }

  const publicEndpoints = ["PublicDeal"]

  return new ApolloServer({ 
    typeDefs: [
      typeDefs, 
      InvestorsResolver.Schema, 
      DealsResolver.Schema,
      ExchangeResolver.Schema,
      InvestmentsResolver.Schema,
      OrganizationsResolver.Schema
    ], 
    resolvers,
    context: async ({ req }) => {
      if (publicEndpoints.includes(req.body.operationName)) {
        return {}
      }

      const user = await authenticate({ req, db })
      return { user, db }
    },
    formatError: (err) => {
      logger.error(err)
      return err
    }
  })
}

module.exports = { authedServer }
