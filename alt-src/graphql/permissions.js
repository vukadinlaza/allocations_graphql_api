const { AuthenticationError } = require('apollo-server-express')

const isAdmin = ctx => {
  if (!ctx.user || !ctx.user.admin) {
    throw new AuthenticationError('permission denied');
  }
}

module.exports = { isAdmin }