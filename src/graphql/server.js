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
const InvestorsResolver = require('../resolvers/investors')
const InvestmentsResolver = require('../resolvers/investments')
const OrganizationsResolver = require('../resolvers/organizations')

const logger = require('pino')({ prettyPrint: process.env.NODE_ENV !== "production" })

const typeDefs = gql`
  type Organization {
    _id: String
    name: String
    slug: String
    logo: String
    admins: [User]
    investors: [User]
    investor(_id: String): User
    deals: [Deal]
    deal(_id: String): Deal
    investments: [Investment]
    investment(_id: String): Investment
  }

  type Document {
    path: String
    link: String
  }

  type Query {
    investment(_id: String): Investment

    organization(slug: String!): Organization
    
    allInvestors: [User]
    allInvestments: [Investment]

    publicDeal(company_name: String!, invite_code: String!): Deal
  }

  type Mutation {
    signUp(inviteKey: String): User

    updateUser(input: UserInput): User
    updateInvestor(investment: InvestmentInput): User
  }

  input UserInput {
    _id: String
    investor_type: String
    country: String
    first_name: String
    last_name: String
    entity_name: String
    signer_full_name: String
    accredited_investor_status: String
    email: String
    passport: Upload
    accredidation_doc: Upload
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
    Investment: InvestmentsResolver.Investment,
    Organization: OrganizationsResolver.Organization,
    Mutation: {
      ...DealsResolver.Mutations,
      ...InvestorsResolver.Mutations,
      ...InvestmentsResolver.Mutations,

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
    typeDefs: [typeDefs, InvestorsResolver.Schema, DealsResolver.Schema, InvestmentsResolver.Schema], 
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
