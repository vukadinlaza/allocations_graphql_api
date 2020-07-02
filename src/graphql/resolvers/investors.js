const { ObjectId } = require("mongodb")
const { gql } = require('apollo-server-express')
const { isAdmin, isOrgAdmin, isFundAdmin, isAdminOrSameUser, ensureFundAdmin } = require('../permissions')
const { AuthenticationError } = require('apollo-server-express')
const Cloudfront = require('../../cloudfront')
const Uploader = require('../../uploaders/investor-docs')
const Users = require('../schema/users')

/**  

  handles all investor flow

**/

const Schema = Users

const User = {
  /** invited deal show deal info based on ctx (if invited) **/
  invitedDeal: async (user, { deal_slug, fund_slug }, ctx) => {
    const fund = await ctx.db.organizations.findOne({ slug: fund_slug })

    // if fund admin or superadmin -> show
    if (isFundAdmin(fund_slug, ctx.user) || ctx.user.admin) {
      return ctx.db.deals.findOne({ slug: deal_slug, organization: fund._id })
    } else {
      // otherwise make sure they are invited!
      const deal = await ctx.db.deals.findOne({ 
        slug: deal_slug,
        organization: fund._id,
        $or: [
          { invitedInvestors: ObjectId(user._id) }, 
          { allInvited: true, organization: { $in: user.organizations || [] } }
        ]
      })
      if (deal) return deal
      throw new AuthenticationError("REDIRECT")
    }
  },
  investments: (user, _, { db }) => {
    return db.investments.find({ user_id: user._id }).toArray()
  },
  invitedDeals: (user, _, { db }) => {
    return db.deals.find({ 
      status: { $ne: 'closed' },
      $or: [
        { invitedInvestors: ObjectId(user._id) },
        // if allInvited and user is part of this org
        { allInvited: true, organization: { $in: user.organizations || [] } }
      ] 
    }).toArray()
  },
  passport: (user) => {
    return user.passport ? { link: Cloudfront.getSignedUrl(user.passport), path: user.passport } : null
  },
  accredidation_doc: (user) => {
    return user.accredidation_doc ? { link: Cloudfront.getSignedUrl(user.accredidation_doc), path: user.accredidation_doc } : null
  },
  name: (user) => {
    return user.investor_type === "entity"
      ?  user.entity_name
      : `${user.first_name} ${user.last_name}`
  },
  organizations_admin: (user, _, { db }) => {
    if (user.admin) {
      // super admin can see all funds
      return db.organizations.find().toArray()
    }

    return db.organizations.find({
      _id: { $in: (user.organizations_admin || []).map(ObjectId) }
    }).toArray()
  }
}

const Queries = {
  /** admin or investor themselves can query **/
  investor: async (_, args, ctx) => {
    // only admins can arbitrarily query
    if (args._id) isAdmin(ctx)

    const query = args._id 
      ? { _id: ObjectId(args._id) } 
      : { email: ctx.user.email }

    return ctx.db.collection("users").findOne(query)        
  },
  allInvestors: (_, args, ctx) => {
    isAdmin(ctx)
    return db.collection("users").find({}).toArray()
  },
  searchUsers: async (_, {org, q, limit}, ctx) => {
    const orgRecord = await ensureFundAdmin(org, ctx)

    const searchQ = {
      $or: [
        {first_name: { $regex: new RegExp(q), $options: "i" }},
        {last_name: { $regex: q, $options: "i" }},
        {entity_name: { $regex: q, $options: "i" }},
        {email: { $regex: q, $options: "i" }}
      ]
    }
    const orgCheck = ctx.user.admin ? {} : { organizations: orgRecord._id }

    return ctx.db.collection("users").find({
      ...orgCheck,
      ...searchQ
    }).limit(limit || 10).toArray()
  }
}

const Mutations = {
  /** creates investor w/ created_at **/
  createInvestor: async (_, { user }, ctx) => {
    isAdmin(ctx)

    const res = await ctx.db.collection("users").insertOne({ ...user, created_at: Date.now() })
    return res.ops[0]
  },
  /** updates user and handles file uploads **/
  updateUser: async (_, {input: {_id, passport, accredidation_doc, ...user}}, ctx) => {
    isAdminOrSameUser({ _id }, ctx)

    // upload passport if passed
    if (passport && !passport.link) {
      const file = await passport
      const s3Path = await Uploader.putInvestorDoc(_id, file, "passport")

      return ctx.db.users.updateOne(
        { _id: ObjectId(_id) },
        { $set: { ...user, passport: s3Path } }
      )
    }

    // upload accredidation_doc if passed
    if (accredidation_doc && !accredidation_doc.link) {
      const file = await accredidation_doc
      const s3Path = await Uploader.putInvestorDoc(_id, file, "accredidation_doc")

      return ctx.db.users.updateOne(
        { _id: ObjectId(_id) },
        { $set: { ...user, accredidation_doc: s3Path } }
      )
    }

    return ctx.db.users.updateOne(
      { _id: ObjectId(_id) },
      { $set: user }
    )                
  },
  /** deletes investor -> TODO delete their investment as well **/
  deleteInvestor: async (_, { _id }, ctx) => {
    isAdmin(ctx)

    try {
      const res = await ctx.db.users.deleteOne({ _id: ObjectId(_id) })
      return res.deletedCount === 1
    } catch (e) {
      return false
    }
  }
}

module.exports = { 
  Schema,
  Queries,
  Mutations,
  subResolvers: { User } 
}