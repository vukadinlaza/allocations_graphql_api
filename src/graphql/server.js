const { ApolloServer} = require('apollo-server-express')
const { verify, authenticate } = require('../auth')

const logger = require('../utils/logger')
const { typeDefs, resolvers } = require('../resolvers')

function authedServer (db) {
  const publicEndpoints = ["PublicDeal"]

  return new ApolloServer({ 
    typeDefs,
    resolvers,
    context: async ({ req }) => {
      // public deal endpoint skips authentication    
      if (publicEndpoints.includes(req.body.operationName)) {
        return { db }
      }

      const user = await authenticate({ req, db })
      return { user, db }
    },
    plugins: [
      {
        requestDidStart: (r) => {
          return {
            didEncounterErrors: ({ context, operationName, errors }) => {
              logger.error(errors[0])
              logger.error({ user: context.user || {}, operationName })
            }
          }
        }
      }
    ]
  })
}

module.exports = { authedServer }
