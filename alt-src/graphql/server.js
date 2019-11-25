const { ApolloServer, gql, AuthenticationError } = require('apollo-server-express')
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
    closed: Boolean
    amount: Int
    investments: [Investment]
  }

  type User {
    _id: String
    first_name: String
    last_name: String
    email: String
    admin: Boolean
    investments: [Investment]
  }

  type Query {
    investor(email: String!): User
    allDeals: [Deal]
    allInvestors: [User]
  }
`

const unauthorized = {
  message: "UNAUTHORIZED",
  statusCode: 401
}

const isAdmin = ctx => {
  if (!ctx.user.admin) {
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
      investor: (_, args, ctx) => {
        isAdminOrSameUser(args, ctx)
        return db.collection("users").findOne({ email: args.email })        
      },
      // current_user: (_, __, ctx) => db.collection("users").findOne({ email: get(ctx, 'user.email')}),

      // admin API
      allDeals: (_, args, ctx) => {
        isAdmin(ctx)
        return db.collection("deals").find({}).toArray()
      },
      allInvestors: (_, args, ctx) => {
        isAdmin(ctx)
        return db.collection("users").find({}).toArray()
      }
    },
    User: {
      investments: (user) => {
        return db.collection("investments").find({ user_id: user._id }).toArray()
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