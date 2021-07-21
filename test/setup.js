const { ApolloServer } = require('apollo-server-express')
const { createTestClient } = require('apollo-server-integration-testing')
const { connect, drop } = require('../src/mongo')
const { authenticate } = require('./auth')
const { typeDefs, resolvers } = require('../src/graphql/resolvers')

const userFixtures = require('./fixtures/users')

function uuid() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

const seeds = {
  standard: async (db) => {
    // seed some user data
    const { ops: [org]} = await db.organizations.insertOne({ name: "Cool Fund", slug: "cool-fund" })

    const { ops: [deal]} = await db.deals.insertOne({
      company_name: 'test-deal',
      organization: org._id,
      status: "onboarding",
      dealParams: {},
      slug: 'test-deal',
      created_at: Date.now(),
      inviteKey: uuid()
    })

    await Promise.all(
      userFixtures.map(user => db.users.insertOne(user(org)))
    )
  }
}

// user can be a string for a fixture or an actual user record
const testClient = (apolloServer, user) => {

  const authorization = user.email ? user.email.split('@')[0] : user

  return createTestClient({ 
    apolloServer,
    extendMockRequest: {
      headers: { authorization }
    }
  })
}

async function testServer () {
  const db = await connect()

  // reset db because its test
  await drop(db)

  // seed db
  await seeds.standard(db)

  const server = new ApolloServer({ 
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

  // expose db for tests to access
  server.db = db
  return server
}

module.exports = { testServer, testClient }
