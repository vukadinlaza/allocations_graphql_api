const { ObjectId } = require('mongodb')
const { isAdmin } = require('../graphql/permissions')
const PublicUploader = require('../uploaders/public-docs')
const { AuthenticationError, gql } = require('apollo-server-express')

const Schema = gql`
  type Organization {
    _id: String
    name: String
    slug: String
    logo: String
    admins: [User]
    investors: [User]
    investor(_id: String): User
    deals: [Deal]
    deal(_id: String): Deal
    investments: [Investment]
    investment(_id: String): Investment
  }

  input OrganizationInput {
    name: String!
    slug: String!
    logo: Upload
  }

  extend type Query {
    organization(slug: String!): Organization
  }

  extend type Mutation {
    createOrganization(organization: OrganizationInput!): Organization
  }
`

const Queries = {
  organization: async (_, { slug }, { user, db }) => {
    const org = await db.organizations.findOne({ slug })
    if (org && user && user.organizations_admin.map(id => id.toString()).includes(org._id.toString())) {
      return org
    }
    throw new AuthenticationError()
  }
}

const Mutations = {
  createOrganization: async (_, { organization: { logo, ...organization } }, ctx) => {
    isAdmin(ctx)

    // upload logo
    if (logo) {
      await PublicUploader.upload({ doc: logo, path: `organizations/${organization.slug}.png` })
    }

    const res = await ctx.db.organizations.insertOne({
      ...organization,
      created_at: Date.now()
    })
    const org = res.ops[0]

    // add user to org admin
    await ctx.db.users.updateOne(
      { _id: ctx.user._id }, 
      { $push: { organizations_admin: org._id } }
    )
    return org
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
    if (org.slug === "allocations") {
      return db.deals.findOne({ _id: ObjectId(_id), organization: { $in: [org._id, null] }})
    } else {
      return db.deals.findOne({ _id: ObjectId(_id), organization: org._id })
    }
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

module.exports = { Organization, Queries, Schema, Mutations }