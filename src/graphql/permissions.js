const { AuthenticationError } = require('apollo-server-express')

const isAdmin = ctx => {
  if (!ctx.user || !ctx.user.admin) {
    throw new AuthenticationError('permission denied');
  }
}

const ensureFundAdmin = async (slug, { user, db }) => {
  if (user.admin) {
    return db.organizations.findOne({ slug })
  } else {
    const org = (user.orgs || []).find(o => o.slug === slug)
    if (org) return org

    throw new AuthenticationError("permission denied")
  }
}

const isOrgAdmin = (orgSlug, { user }) => {
  const org = (user.orgs || []).find(o => o.slug === orgSlug)
  if (org) return org

  throw new AuthenticationError("permission denied")
}

const isAdminOrSameUser = (user, ctx) => {
  if (ctx.user && (ctx.user._id.toString() === user._id.toString() || ctx.user.admin)) {
    return
  }
  throw new AuthenticationError('permission denied')
}

// fundAdmin gives boolean for if they are a fund admin
const isFundAdmin = (slug, user) => {
  return Boolean((user.orgs || []).find(o => o.slug === slug))
}

module.exports = { 
  isAdmin, 
  isAdminOrSameUser, 
  isOrgAdmin,

  // transitioning to more accurate phrasing 
  ensureFundAdmin,
  isFundAdmin 
}