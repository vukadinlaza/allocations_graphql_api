const { ApolloServer, PubSub } = require('apollo-server-express')
const { verify, authenticate } = require('../auth')

const logger = require('../utils/logger')
const { typeDefs, resolvers } = require('../graphql/resolvers')

const pubsub = new PubSub();

function authedServer (db) {
  const publicEndpoints = ["PublicDeal"]

  return new ApolloServer({ 
    typeDefs,
    resolvers,
    context: async ( payload ) => {
      // public deal endpoint skips authentication   
      console.log({payload})
      if (payload.req && payload.req.body && publicEndpoints.includes(req.body.operationName)) {
        return { db }
      }

      const user = await authenticate({ req: payload.req, db })

      return { user, db, pubsub }
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

module.exports = { authedServer, pubsub }
