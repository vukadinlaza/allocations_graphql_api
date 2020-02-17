const { AuthenticationError } = require('apollo-server-express')

const isAdmin = ctx => {
  if (!ctx.user || !ctx.user.admin) {
    throw new AuthenticationError('permission denied');
  }
}

const isOrgAdmin = (orgSlug, { user }) => {
  const org = user.orgs.find(o => o.slug === orgSlug)
  if (org) return org

  throw new AuthenticationError()
}

const isAdminOrSameUser = (user, ctx) => {
  if (ctx.user && (ctx.user._id.toString() === user._id.toString() || ctx.user.admin)) {
    return
  }
  throw new AuthenticationError('permission denied')
}

module.exports = { isAdmin, isAdminOrSameUser, isOrgAdmin }