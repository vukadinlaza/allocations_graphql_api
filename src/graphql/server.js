const { ApolloServer, PubSub } = require('apollo-server-express')
const { verify, authenticate } = require('../auth')
const logger = require('../utils/logger')
const { typeDefs, resolvers } = require('../graphql/resolvers')

const pubsub = new PubSub();

function authedServer(db) {
  const publicEndpoints = ["PublicDeal"]

  return new ApolloServer({
    typeDefs,
    resolvers,
    uploads: false,
    context: async (payload) => {
      // public deal endpoint skips authentication  
      if (payload.req && payload.req.body && publicEndpoints.includes(payload.req.body.operationName)) {
        return { db }
      }
      const authToken = payload && payload.connection && payload.connection.context && payload.connection.context.authToken
      const user = await authenticate({ req: payload.req, db, authToken })
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
