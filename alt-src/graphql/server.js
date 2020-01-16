const { ApolloServer, gql, AuthenticationError } = require('apollo-server-express')
const { ObjectId } = require("mongodb")
const auth0 = require('auth0')
const { get } = require('lodash')
const { authenticate } = require('../auth')

const { isAdmin, isAdminOrSameUser } = require('./permissions')
const Cloudfront = require('../cloudfront')
const Uploader = require('../uploaders/investor-docs')

const DealsResolver = require('../resolvers/deals')
const InvestorsResolver = require('../resolvers/investors')
const InvestmentsResolver = require('../resolvers/investments')

const logger = require('pino')({ prettyPrint: process.env.NODE_ENV !== "production" })

const typeDefs = gql`
  type Document {
    path: String
    link: String
  }

  type Query {
    investor(email: String, _id: String): User
    
    investment(_id: String): Investment
    
    allInvestors: [User]
    allInvestments: [Investment]
    searchUsers(q: String!, limit: Int): [User]
  }

  type Mutation {
    signUp(inviteKey: String): User

    createInvestor(user: UserInput): User
    updateUser(input: UserInput): User
    updateInvestor(investment: InvestmentInput): User

    deleteInvestor(_id: String!): Boolean
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
  }

  type File {
    filename: String!
    mimetype: String!
    encoding: String!
  }
`

module.exports = function initServer (db) {
  const resolvers = {
    Query: {
      // user API
      ...InvestorsResolver.Queries,
      ...DealsResolver.Queries,

      investment: (_, args, ctx) => {
        isAdmin(ctx)
        return db.collection("investments").findOne({ _id: ObjectId(args._id) })
      },

      // admin API
      allInvestors: (_, args, ctx) => {
        isAdmin(ctx)
        return db.collection("users").find({}).toArray()
      },
      allInvestments: (_, __, ctx) => {
        isAdmin(ctx)
        return db.collection("investments").find({}).toArray()
      },
      searchUsers: (_, {q, limit}, ctx) => {
        isAdmin(ctx)
        return db.collection("users").find({ 
          $or: [
            {first_name: { $regex: new RegExp(q), $options: "i" }},
            {last_name: { $regex: q, $options: "i" }},
            {email: { $regex: q, $options: "i" }}
          ]
        }).limit(limit || 10).toArray()
      }
    },
    User: InvestorsResolver.User,
    Investment: InvestmentsResolver.Investment,
    Deal: DealsResolver.Deal,
    Mutation: {
      ...DealsResolver.Mutations,
      ...InvestorsResolver.Mutations,
      ...InvestmentsResolver.Mutations,

      // inviteKey refers to a deal the user has been invited too
      signUp: async (_, { inviteKey }, ctx) => {
        let user;
        if (ctx.user) {
          user = ctx.user
        } else {
          // get auth0 creds
          const { email } = await auth0Client.getProfile(ctx.token.slice(7))
          const res = await db.collection("users").insertOne({ email })
          user = res.ops[0]
        }

        // invite user to Deal if key correct
        if (inviteKey) {
          await db.collection("deals").updateOne(
            { inviteKey: inviteKey },
            { $push: { invitedInvestors: ObjectId(user._id) } }
          )
        }
        return user     
      },

      updateUser: async (_, {input: {_id, passport, ...user}}, ctx) => {
        isAdminOrSameUser({ _id }, ctx)

        // upload passport if passed
        if (passport && !passport.link) {
          const file = await passport
          const s3Path = await Uploader.putInvestorDoc(_id, file)

          return db.collection("users").updateOne(
            { _id: ObjectId(_id) },
            { $set: { ...user, passport: s3Path } }
          )
        }

        return db.collection("users").updateOne(
          { _id: ObjectId(_id) },
          { $set: user }
        )                
      },
      updateInvestor: async (_, {_id, ...investor}, ctx) => {
        isAdmin(ctx)

        const documents = await Uploader.putUserFile({}, investor.documents)

        const res = await db.collection("users").findOneAndUpdate(
          { _id: ObjectId(_id) },
          { $set: {...investor, documents} },
          { returnOriginal: false }
        )
        return res.value
      }
    }
  }

  return new ApolloServer({ 
    typeDefs: [typeDefs, InvestorsResolver.Schema, DealsResolver.Schema, InvestmentsResolver.Schema], 
    resolvers,
    context: async ({ req }) => {
      let start = Date.now()
      const user = await authenticate({ req, db })
      logger.info("Context took:", Date.now() - start, "ms")
      return { user, db }
    },
    formatError: (err) => {
      logger.error(err)
      return err
    }
  })
}
