const { ApolloServer} = require('apollo-server-express')
const { verify, authenticate } = require('../auth')

const logger = require('../utils/logger')
const rollbar = require('../utils/rollbar')
const { typeDefs, resolvers } = require('../resolvers')

function authedServer (db) {
  const publicEndpoints = ["PublicDeal"]

  return new ApolloServer({ 
    typeDefs,
    resolvers,
    context: async ({ req }) => {      
      if (publicEndpoints.includes(req.body.operationName)) {
        return { db }
      }

      const user = await authenticate({ req, db })
      return { user, db }
    },
    formatError: (err) => {
      logger.error(err)
      rollbar.error(err)
      return err
    }
  })
}

module.exports = { authedServer }
