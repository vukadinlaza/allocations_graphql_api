const { ObjectId } = require("mongodb")
const { isAdmin, isAdminOrSameUser } = require('../graphql/permissions')

async function deleteInvestor (_, { _id }, ctx) {
  isAdmin(ctx)

  try {
    await ctx.db
      .collection("users")
      .deleteOne({ _id: ObjectId(_id) })
    return true
  } catch (e) {
    return false
  }
}

module.exports = {
  Mutations: {
    deleteInvestor
  }
}