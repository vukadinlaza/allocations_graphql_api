const { ApolloServer, gql, AuthenticationError } = require('apollo-server-express')
const { ObjectId } = require("mongodb")
const auth0 = require('auth0')
const { get } = require('lodash')
const { authenticate } = require('../auth')

const { isAdmin } = require('./permissions')
const Cloudfront = require('../cloudfront')
const Uploader = require('../uploaders/investor-docs')

const InvestorsResolver = require('../resolvers/investors')
const InvestmentsResolver = require('../resolvers/investments')

const logger = require('pino')({ prettyPrint: process.env.NODE_ENV !== "production" })

const typeDefs = gql`
  type Investment {
    _id: String
    amount: Int
    deal: Deal
    user: User
    documents: [Document]
    investor: User
  }

  type Deal {
    _id: String
    company_name: String
    company_description: String
    investment_documents: String
    date_closed: String
    deal_lead: String
    pledge_link: String
    onboarding_link: String
    embed_code: String
    closed: Boolean
    amount: Int
    investments: [Investment]
    invitedInvestors: [User]
    inviteKey: String
  }

  type Document {
    path: String
    link: String
  }

  type Query {
    investor(email: String, _id: String): User
    deal(_id: String): Deal
    investment(_id: String): Investment
    allDeals: [Deal]
    allInvestors: [User]
    allInvestments: [Investment]
    searchUsers(q: String!, limit: Int): [User]
    searchDeals(q: String!, limit: Int): [Deal]
  }

  type Mutation {
    signUp(inviteKey: String): User

    createInvestor(user: UserInput): User
    updateUser(input: UserInput): User
    createDeal(company_name: String, company_description: String, deal_lead: String, date_closed: String, pledge_link: String, onboarding_link: String): Deal
    inviteInvestor(user_id: String!, deal_id: String!): Deal
    uninviteInvestor(user_id: String!, deal_id: String!): Deal
    updateDeal(_id: String!, company_name: String, company_description: String, deal_lead: String, date_closed: String, pledge_link: String, onboarding_link: String): Deal
    updateInvestor(investment: InvestmentInput): User

    deleteInvestor(_id: String!): Boolean
    deleteInvestment(_id: String!): Boolean

    createInvestment(investment: InvestmentInput!): Investment
    addInvestmentDoc(investment_id: String!, doc: Upload!): String
    rmInvestmentDoc(investment_id: String!, file: String!): Boolean
  }

  input InvestmentInput {
    _id: String
    amount: Int
    deal_id: String
    user_id: String
    documents: String
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

      deal: (_, args, ctx) => {
        isAdmin(ctx)
        return db.collection("deals").findOne({ _id: ObjectId(args._id) })
      },

      investment: (_, args, ctx) => {
        isAdmin(ctx)
        return db.collection("investments").findOne({ _id: ObjectId(args._id) })
      },

      // admin API
      allDeals: (_, args, ctx) => {
        isAdmin(ctx)
        return db.collection("deals").find({}).toArray()
      },
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
      },
      searchDeals: (_, {q, limit}, ctx) => {
        isAdmin(ctx)
        return db.collection("deals").find({
          company_name: { $regex: new RegExp(q), $options: "i" }
        }).limit(limit || 10).toArray()
      }
    },
    User: {
      investments: (user) => {
        return db.collection("investments").find({ user_id: user._id }).toArray()
      },
      invitedDeals: (user) => {
        return db.collection("deals").find({ closed: { $ne: true }, invitedInvestors: ObjectId(user._id) }).toArray()
      },
      passport: (user) => {
        return user.passport ? { link: Cloudfront.getSignedUrl(user.passport), path: user.passport } : null
      }
    },
    Investment: {
      deal: (investment) => {
        return db.collection("deals").findOne({ _id: investment.deal_id })
      },
      investor: (investment) => {
        return db.collection("users").findOne({ _id: investment.user_id })
      },
      documents: (investment) => {
        if (Array.isArray(investment.documents)) {
          return investment.documents.map(path => {
            return { link: Cloudfront.getSignedUrl(path), path }
          })
        } else {
          return []
        }
      }
    },
    Deal: {
      investments: (deal) => {
        return db.collection("investments").find({ deal_id: deal._id }).toArray()
      },
      invitedInvestors: async (deal) => {
        return db.collection("users").find({ _id: { $in: deal.invitedInvestors || [] }}).toArray()
      }
    },
    Mutation: {
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
        isAdminOrSameUser(user, ctx)

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

      createDeal: async (_, deal, ctx) => {
        isAdmin(ctx)
        const res = await db.collection("deals").insertOne(deal)
        return res.ops[0]
      },
      inviteInvestor: (_, { user_id, deal_id }, ctx) => {
        isAdmin(ctx)
        return db.collection("deals").updateOne(
          { _id: ObjectId(deal_id) },
          { $push: { invitedInvestors: ObjectId(user_id) } }
        )
      },
      uninviteInvestor: (_, { user_id, deal_id }, ctx) => {
        isAdmin(ctx)
        return db.collection("deals").updateOne(
          { _id: ObjectId(deal_id) },
          { $pull: { invitedInvestors: ObjectId(user_id) } }
        )
      },
      updateDeal: async (_, {_id, ...deal}, ctx) => {
        isAdmin(ctx)
        const res = await db.collection("deals").findOneAndUpdate(
          { _id: ObjectId(_id) },
          { $set: deal },
          { returnOriginal: false }
        )
        return res.value
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
      },
      createInvestment: async (_, { investment: { user_id, deal_id, ...investment }}, ctx) => {
        isAdmin(ctx)
        const res = await db.collection("investments").insertOne({
          ...investment,
          user_id: ObjectId(user_id),
          deal_id: ObjectId(deal_id)
        })
        return res.ops[0]        
      },

      addInvestmentDoc: async (_, {investment_id, doc}, ctx) => {
        isAdmin(ctx)

        const file = await doc
        const s3Path = await Uploader.putInvestmentDoc(investment_id, file)

        await db.collection("investments").updateOne(
          { _id: ObjectId(investment_id) },
          { $addToSet: { documents: s3Path } }
        )

        return Cloudfront.getSignedUrl(s3Path)
      },
      rmInvestmentDoc: async (_, {investment_id, file}, ctx) => {
        isAdmin(ctx)
        await Uploader.rmInvestmentDoc(investment_id, file)
        await db.collection("investments").updateOne(
          { _id: ObjectId(investment_id) },
          { $pull: { documents: `${investment_id}/${file}` } }
        )
        return true
      }
    }
  }

  return new ApolloServer({ 
    typeDefs: [typeDefs, InvestorsResolver.Schema], 
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
