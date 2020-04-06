const { AuthenticationError } = require('apollo-server-express')
const users = require('./fixtures/users')

// mock authenticate method that doesn't actually hit Auth0 servers
// and resolves to user fixtures
async function authenticate ({ req, db }) {
  const token = req.headers.authorization
  if (!token) {
    throw new AuthenticationError()
  }

  const user = await db.users.findOne({ email: `${token}@allocations.com` })
  if (user.organizations_admin) {
    user.orgs = await db.organizations.find({ _id: { $in: user.organizations_admin } }).toArray()
  }
  return user
}

module.exports = { authenticate }