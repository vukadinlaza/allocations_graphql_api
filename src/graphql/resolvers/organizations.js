const { ObjectId } = require('mongodb')
const _ = require('lodash')
const { isAdmin, isOrgAdmin } = require('../permissions')
const PublicUploader = require('../../uploaders/public-docs')
const AdminMailer = require('../../mailers/admin-mailer')
const { AuthenticationError, gql } = require('apollo-server-express')
const Hellosign = require('../../hellosign')
const Organizations = require('../schema/organizations')
/** 

  all organization handling (sometimes called funds)

 **/

const Schema = Organizations

const Queries = {
  organization: async (_, { slug, limit, offset }, { user, db }) => {
    console.log('X', limit, offset)
    const org = await db.organizations.findOne({ slug })
    // short circuit with fund if superadmin
    if (user.admin) return org
    if (slug === 'demo-fund') return org

    if (org && user && (user.organizations_admin || []).map(id => id.toString()).includes(org._id.toString())) {
      return org
    }
    throw new AuthenticationError('org query throw')
  },
  /** members must have the org id on their .organizations_admin key **/
  organizationMembers: async (_, { slug }, { user, db }) => {
    isAdmin({ user, db })
    const org = await db.organizations.findOne({ slug })

    return db.users.find({ organizations_admin: org._id }).toArray()
  }
}

const Mutations = {
  /** creates org and adds the creator to the fund automatically  **/
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
  },
  /** simple update **/
  updateOrganization: async (_, { organization: { _id, slug, ...organization } }, ctx) => {
    isOrgAdmin(_id, { user: ctx.user })
    const updatedOrg = await ctx.db.organizations.findOneAndUpdate(
      { _id: ObjectId(_id) },
      { $set: { ...organization, slug, updated_at: Date.now(), } },
      { returnOriginal: false },

    )
    return updatedOrg.value
  },
  /** TODO -> deletes org and all associations **/
  deleteOrganization: async (_, { _id }, ctx) => {
    isAdmin(ctx)

    /** 
     * we need to delete a number of things here
     * 1) the org
     * 2) any deals from the org
     * 3) any investments originating from the org
     * 4) any user permission references the the org
     **/
    return true
  },
  /** add member to org **/
  addOrganizationMembership: async (_, { slug, user_id }, ctx) => {
    isAdmin(ctx)
    const { _id } = await ctx.db.organizations.findOne({ slug })
    return ctx.db.users.updateOne(
      { _id: ObjectId(user_id) },
      { $push: { organizations_admin: _id } }
    )
  },
  /** rm member from org **/
  revokeOrganizationMembership: async (_, { slug, user_id }, ctx) => {
    isAdmin(ctx)
    const { _id } = await ctx.db.organizations.findOne({ slug })
    return ctx.db.users.updateOne(
      { _id: ObjectId(user_id) },
      { $pull: { organizations_admin: _id } }
    )
  },
  /** sends invite, mail and db **/
  sendAdminInvite: async (_, { slug, user_id }, ctx) => {
    isAdmin(ctx)

    const org = await ctx.db.organizations.findOne({ slug })
    const { email } = await ctx.db.users.findOne({ _id: ObjectId(user_id) })
    const invite = await AdminMailer.sendInvite({ org, to: email })

    await ctx.db.organizations.updateOne(
      { slug },
      { $push: { adminInvites: invite } }
    )
    return invite
  },
  /** add compliance task **/
  createComplianceTask: async (_, { slug, complianceTask }, ctx) => {
    isAdmin(ctx)

    // if compliance task is a signature -> create signature request and 
    // store it in the compliance record
    if (complianceTask.is_signature) {
      const { signatures } = await Hellosign.createRequest(ctx.user, complianceTask.signature_template)
      complianceTask.signature_request_id = signatures[0].signature_id
    }

    const org = await ctx.db.organizations.findOne({ slug })
    const res = await ctx.db.compliancetasks.insertOne({ ...complianceTask, organization_id: org._id })

    return res.ops[0]
  },
  updateComplianceTask: async (_, { slug, complianceTask: { _id, ...rest } }, ctx) => {
    isAdmin(ctx)

    return ctx.db.compliancetasks.updateOne(
      { _id: ObjectId(_id) },
      { $set: rest }
    )
  },
  deleteComplianceTask: async (_, { _id }, ctx) => {
    isAdmin(ctx)

    try {
      const res = await ctx.db.compliancetasks.deleteOne({ _id: ObjectId(_id) })
      return res.deletedCount === 1
    } catch (e) {
      return false
    }
  }
}

const Organization = {
  deals: (org, { order_by = "created_at", order_dir = -1, limit, offset, status }, { db }) => {
    console.log('LIMIT', limit, offset, status)
    const activeStatus = status === 'active' ? ['onboarding', 'closing'] : ['onboarding',
      'closing',
      'closed',
      'draft']
    const query = {
      organization: org._id,
      status: { "$in": activeStatus }

    }
    // default sort order is descending by created_at
    return db.deals
      .find(query)
      .sort({ [order_by]: order_dir })
      .skip(offset || 0)
      .limit(limit || 50)
      .toArray()
  },
  deal: (org, { _id }, { db }) => {
    if (org.slug === "allocations") {
      return db.deals.findOne({ _id: ObjectId(_id), organization: { $in: [org._id, null] } })
    } else {
      return db.deals.findOne({ _id: ObjectId(_id), organization: org._id })
    }
  },
  n_deals: (org, _, { db }) => {
    if (org.slug === "allocations") {
      return db.deals.count({ organization: { $in: [org._id, null] } })
    } else {
      return db.deals.count({ organization: org._id })
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
      ? { organization: { $in: [org._id, null] } }
      : { organization: org._id }

    const deals = await db.collection("deals").find(dealQuery).toArray()
    return db.investments.find({ deal_id: { $in: deals.map(d => d._id) } }).toArray()
  },
  investment: (org, { _id }, { db }) => {
    return db.investments.findOne({ _id: ObjectId(_id), organization: org._id })
  },
  adminInvites: (org) => {
    return org.adminInvites || []
  },
  complianceTasks: (org, _, { db }) => {
    return db.compliancetasks.find({ organization_id: org._id }).toArray()
  },
  exchangeDeals: (org, _, { db }) => {
    return db.deals.find({ status: "closed", no_exchange: { $ne: true } }).toArray()
  },
  matchRequests: (org, _, { db }) => {
    return db.matchrequests.find({ organization_id: org._id }).toArray()
  },
  trades: (org, _, { db }) => {
    return db.trades.find({ organization_id: org._id }).toArray()
  },
  orders: (org, _, { db }) => {
    return db.orders.find({ organization_id: org._id }).toArray()
  },
  documentTemplates: async (org, _, ctx) => {
    isAdmin(ctx)
    return Hellosign.listTemplates()
  },
  masterFiling: async org => [],
  // since approved was added on later, we're going to assume any previous one IS approved
  approved: (org) => {
    return org.approved !== false
  }
}

const ComplianceTask = {
  signature_url: (task) => {
    return task.is_signature && task.status !== "done" ? Hellosign.getSignUrl(task.signature_request_id) : null
  }
}

module.exports = {
  Organization,
  Queries,
  Schema,
  Mutations,
  subResolvers: { Organization, ComplianceTask }
}
