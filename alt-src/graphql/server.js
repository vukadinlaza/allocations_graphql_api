const { ApolloServer, gql, AuthenticationError } = require('apollo-server-express')
const { ObjectId } = require("mongodb")
const auth0 = require('auth0')
const { get } = require('lodash')

const auth0Client = new auth0.AuthenticationClient({
  domain: "login.allocations.co",
  clientId: process.env.AUTH0_CLIENT_ID 
})

const typeDefs = gql`
  type Investment {
    _id: String
    amount: Int
    deal: Deal
    user: User
    documents: String
  }

  type Deal {
    _id: String
    company_name: String
    company_description: String
    investment_documents: String
    date_closed: String
    deal_lead: String
    pledge_link: String
    closed: Boolean
    amount: Int
    investments: [Investment]
    invitedInvestors: [User]
  }

  type User {
    _id: String
    first_name: String
    last_name: String
    email: String
    admin: Boolean
    investments: [Investment]
    invitedDeals: [Deal]
  }

  type Query {
    investor(email: String, _id: String): User
    deal(_id: String): Deal
    allDeals: [Deal]
    allInvestors: [User]
    searchUsers(q: String!, limit: Int): [User]
  }

  type Mutation {
    inviteInvestor(user_id: String!, deal_id: String!): Deal
    uninviteInvestor(user_id: String!, deal_id: String!): Deal
    updateDeal(_id: String!, company_name: String, company_description: String, deal_lead: String, date_closed: String): Deal
  }
`

const unauthorized = {
  message: "UNAUTHORIZED",
  statusCode: 401
}

const isAdmin = ctx => {
  if (!ctx.user || !ctx.user.admin) {
    throw new AuthenticationError('permission denied');
  }
}

const isAdminOrSameUser = (args, ctx) => {
  if (ctx.user && (ctx.user.email === args.email || ctx.user.admin)) return
  throw new AuthenticationError('permission denied');
}

module.exports = function initServer (db) {
  const resolvers = {
    Query: {
      // user API
      investor: async (_, args, ctx) => {
        isAdminOrSameUser(args, ctx)

        // ensure one query param sent
        if (!args._id && !args.email) {
          throw new AuthenticationError('permission denied');
        }

        const query = args._id ? { _id: ObjectId(args._id) } : { email: args.email }
        return db.collection("users").findOne(query)        
      },
      // current_user: (_, __, ctx) => db.collection("users").findOne({ email: get(ctx, 'user.email')}),

      deal: (_, args, ctx) => {
        isAdmin(ctx)
        return db.collection("deals").findOne({ _id: ObjectId(args._id) })
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
    User: {
      investments: (user) => {
        return db.collection("investments").find({ user_id: user._id }).toArray()
      },
      invitedDeals: (user) => {
        return db.collection("deals").find({ closed: false }).toArray()
      }
    },
    Investment: {
      deal: (investment) => {
        return db.collection("deals").findOne({ _id: investment.deal_id })
      },
      user: (investment) => {
        return db.collection("users").findOne({ _id: investment.user_id })
      }
    },
    Deal: {
      investments: (deal) => {
        return db.collection("investments").find({ deal_id: deal._id })
      },
      invitedInvestors: async (deal) => {
        return db.collection("users").find({ _id: { $in: deal.invitedInvestors || [] }}).toArray()
      }
    },
    Mutation: {
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
      }
    }
  }

  return new ApolloServer({ 
    typeDefs, 
    resolvers,
    context: async ({ req }) => {
      const token = req.headers.authorization || "";
      // get profile info via auth0
      const user = await getUserFromToken(token, db)
      return { user }
    }
  })
}

async function getUserFromToken (token, db) {
  try {
    const { email } = await auth0Client.getProfile(token.slice(7))
    return db.collection("users").findOne({ email })
  } catch (e) {
    return null
  }
}