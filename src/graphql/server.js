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
