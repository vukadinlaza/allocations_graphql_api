const { ObjectId } = require("mongodb")
const { isAdmin, isAdminOrSameUser } = require('../graphql/permissions')

async function deleteInvestment (_, { _id }, ctx) {
  isAdmin(ctx)

  try {
    const res = await ctx.db
      .collection("investments")
      .deleteOne({ _id: ObjectId(_id) })
    return res.deletedCount === 1
  } catch (e) {
    return false
  }
}

module.exports = {
  Mutations: {
    deleteInvestment
  }
}