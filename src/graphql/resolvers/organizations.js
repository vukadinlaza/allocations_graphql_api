const { ObjectId } = require('mongodb')
const _ = require('lodash')
const { isAdmin, isOrgAdmin } = require('../permissions')
const PublicUploader = require('../../uploaders/public-docs')
const AdminMailer = require('../../mailers/admin-mailer')
const { AuthenticationError, gql } = require('apollo-server-express')
const Hellosign = require('../../hellosign')
const Organizations = require('../schema/organizations')
const { groupBy, map } = require('lodash');
const { customOrgPagination } = require('../pagHelpers')
/**

  all organization handling (sometimes called funds)

 **/

const Schema = Organizations

const Queries = {
  organization: async (_, { slug, limit, offset }, { user, db }) => {
    const org = await db.organizations.findOne({ slug })
    // short circuit with fund if superadmin
    if (user.admin) return org
    if (slug === 'demo-fund') return org
    if (org && user && (user.organizations_admin || []).map(id => id.toString()).includes(org._id.toString())) {
      return org
    }
    throw new AuthenticationError('org query throw')
  },
  pagOrganization: async (_, args, ctx) => {
    const { slug } = args
    const { pagination, currentPage } = args.pagination;

    const documentsToSkip = pagination * (currentPage)

    let query = await ctx.db.organizations.findOne({ slug })

    const result = {org: query, documentsToSkip, pagination, pagArgs: args.pagination}

    if (ctx.user.admin) return result;
    if (slug === 'demo-fund') return result;

    if (query && ctx.user && (ctx.user.organizations_admin || []).map(id => id.toString()).includes(result.org._id.toString())) {
      return result
    }

    throw new AuthenticationError('org query throw')
  },
  /** members must have the org id on their .organizations_admin key **/
  organizationMembers: async (_, { slug }, { user, db }) => {
    isAdmin({ user, db })
    const org = await db.organizations.findOne({ slug })

    return db.users.find({ organizations_admin: org._id }).toArray()
  },
  pagOrganizations: async (_, args, ctx) => {
    isAdmin(ctx)
    const { pagination, currentPage, sortField } = args.pagination;

    const documentsToSkip = pagination * (currentPage)
    const aggregation = customOrgPagination(args.pagination);
    const countAggregation = [...aggregation, { $count: 'count' }]
    const organizationsCount = await ctx.db.collection("organizations")
                              .aggregate(countAggregation)
                              .toArray()
    const count = organizationsCount[0].count;
    console.log(JSON.stringify(aggregation, null, 2))
    let organizations = await ctx.db.collection("organizations")
                            .aggregate(aggregation)
                            .skip(documentsToSkip)
                            .limit(pagination)
                            .toArray()

    return {count , organizations};
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
    let activeStatus = status === 'active' ? ['onboarding', 'closing'] : ['onboarding',
      'closing',
      'closed',
      'draft']

    if (status === 'closed') {
      activeStatus = ['closed']
    }
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
  },
  orgInvestors: async (org, _, { db }) => {
    console.log(org)
    const investments = await db.investments.find({ organization: ObjectId(org._id) }).toArray()
    const investmentsByUser = groupBy(investments, 'user_id')
    const x = await Promise.all(map(investmentsByUser, u => {
      return u
    }).map(user => {
      const id = user[0]
      const total = user.reduce((acc, u) => {
        return acc += u.amount
      }, 0)
      if (!id) return;
      return {
        id: id.user_id,
        amount: total,
        numInvestments: user.length || 0
      }
    }).map(async (u) => {
      const user = await db.users.findOne({ _id: ObjectId(u.id) })
      if (user !== null) {
        return { ...user, ...u }
      }
    }))
    console.log(x)
    return x
  },
  // overview: async (org, args, { db }) => {
  //   const orgDeals = await db.deals.find({organization: org._id}).toArray();
  //   const orgFunds = orgDeals.filter(deal => deal.investmentType === 'fund')
  //                             .map(deal => deal._id)
  //   const orgSPVs = orgDeals.filter(deal => deal.investmentType !== 'fund')
  //                           .map(deal => deal._id)
  //   const orgFundsInvestments = await db.investments.find({deal_id: {$in: orgFunds}, status: {$in: ['wired', 'complete']}}).toArray();
  //   const orgSPVsInvestments = await db.investments.find({deal_id: {$in: orgSPVs}, status: {$in: ['wired', 'complete']}}).toArray();
  //   const totalFundAUM =  orgFundsInvestments
  //                         .map(inv => inv.amount? Number(inv.amount): 0)
  //                         .reduce((acc, n) => acc + n, 0)
  //   const totalSPVAUM = orgSPVsInvestments
  //                         .map(inv => inv.amount? Number(inv.amount): 0)
  //                         .reduce((acc, n) => acc + n, 0)
  //   const totalFunds = orgFunds.length
  //   const totalSPVs = orgSPVs.length
  //   const overviewData = {
  //     totalFundAUM,
  //     totalSPVAUM,
  //     totalFunds,
  //     totalSPVs,
  //     totalInvestors: [...new Set(
  //       [
  //         ...orgFundsInvestments.map(i => i.user_id),
  //         ...orgSPVsInvestments.map(i => i.user_id)
  //       ]
  //     )].length,
  //     totalAUM: totalFundAUM + totalSPVAUM,
  //     totalPrivateFunds: totalFunds + totalSPVs
  //   }

  //   return overviewData
  // }
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

