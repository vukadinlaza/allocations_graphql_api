const { ApolloServer } = require('apollo-server-express')
const { createTestClient } = require('apollo-server-integration-testing')
const { connect, drop } = require('../src/mongo')
const { authenticate } = require('./auth')
const { typeDefs, resolvers } = require('../src/resolvers')

const userFixtures = require('./fixtures/users')

const seeds = {
  standard: async (db) => {
    // seed some user data
    const { ops: [org]} = await db.organizations.insertOne({ name: "Cool Fund", slug: "cool-fund" })
    await Promise.all(
      userFixtures.map(user => db.users.insertOne(user(org)))
    )
  }
}

const testClient = (apolloServer, userType) => {
  return createTestClient({ 
    apolloServer,
    extendMockRequest: {
      headers: { authorization: userType }
    }
  })
}

async function testServer () {
  const db = await connect()

  // reset db because its test
  await drop(db)

  await seeds.standard(db)

  return new ApolloServer({ 
    typeDefs,
    resolvers,
    context: async ({ req }) => {
      // if (publicEndpoints.includes(req.body.operationName)) {
      //   return {}
      // }

      // const user = { ...adminUser, orgs: [org]}
      const user = await authenticate({ req, db })
      return { user, db }
    }
  })
}

module.exports = { testServer, testClient }