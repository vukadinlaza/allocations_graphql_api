const { ObjectId } = require('mongodb')
const { AuthenticationError } = require('apollo-server-express')

const Queries = {
  organization: async (_, { slug }, { user, db }) => {
    const org = await db.organizations.findOne({ slug })
    if (org && user && user.organizations_admin.map(id => id.toString()).includes(org._id.toString())) {
      return org
    }
    throw new AuthenticationError()
  }
}

const Organization = {
  deals: (org, _, { db }) => {
    if (org.slug === "allocations") {
      return db.deals.find({ organization: { $in: [org._id, null] }}).toArray()
    } else {
      return db.deals.find({ organization: org._id }).toArray()
    }
  },
  deal: (org, { _id }, { db }) => {
    return db.deals.findOne({ _id: ObjectId(_id), organization: org._id })
  },
  investors: (org, _, { db }) => {
    if (org.slug === "allocations") {
      return db.users.find().toArray()
    } else {
      return db.users.find({ organizations: org._id }).toArray()
    }
  },
  investor: (org, { _id }, { db }) => {
    if (org.slug === "allocations") {
      return db.users.findOne({ _id: ObjectId(_id) })
    } else {
      return db.users.findOne({ _id: ObjectId(_id), organization: org._id })
    }
  },
  investments: async (org, _, { db }) => {
    const dealQuery = org.slug === "allocations" 
      ? { organization: { $in: [org._id, null] }} 
      : { organization: org._id }

    const deals = await db.collection("deals").find(dealQuery).toArray()
    return db.investments.find({ deal_id: { $in: deals.map(d => d._id) } }).toArray()
  },
  investment: (org, { _id }, { db }) => {
    return db.investments.findOne({ _id: ObjectId(_id), organization: org._id })
  }
}

module.exports = { Organization, Queries }