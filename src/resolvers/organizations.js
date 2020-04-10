const { ObjectId } = require('mongodb')
const _ = require('lodash')
const { isAdmin } = require('../graphql/permissions')
const PublicUploader = require('../uploaders/public-docs')
const AdminMailer = require('../mailers/admin-mailer')
const { AuthenticationError, gql } = require('apollo-server-express')
const Hellosign = require('../hellosign')
const gSheets = require('../google-sheets')

const Schema = gql`
  type Organization {
    _id: String
    name: String
    legal_name: String
    slug: String
    logo: String
    created_at: String

    admins: [User]
    investors: [User]
    investor(_id: String): User
    deals(order_by: String, order_dir: String): [Deal]
    deal(_id: String): Deal
    n_deals: Int
    investments: [Investment]
    investment(_id: String): Investment
    adminInvites: [EmailInvite]
    complianceTasks: [ComplianceTask]
    signingRequests: [SigningRequest]

    masterFiling: [Filing]

    completedProvisionOfServices: Boolean
    provisionOfServicesURL: String
    documentTemplates: [DocumentTemplate]
    
    exchangeDeals: [ExchangeDeal]
    matchRequests: [MatchRequest]
    trades: [Trade]
    orders: [Order]
  }

  type Filing {
    _id: String
    subCategory: String
    step: String
    status: Int
  }

  type DocumentTemplate {
    _id: String
    title: String
  }

  type SigningRequest {
    _id: String
    title: String
    url: String
    status: String
    due: String
  }

  type ComplianceTask {
    _id: String
    task: String
    status: ComplianceTaskStatus
    completed: Boolean
    organization_id: String

    is_signature: Boolean
    signature_template: String
    signature_url: String
  }

  enum ComplianceTaskStatus {
    not_started
    waiting
    in_progress
    done
  }

  input ComplianceTaskInput {
    _id: String
    task: String
    status: ComplianceTaskStatus
    completed: Boolean

    is_signature: Boolean
    signature_template: String
    signature_url: String
  }

  input OrganizationInput {
    name: String!
    slug: String!
    logo: Upload
  }

  extend type Query {
    organization(slug: String!): Organization
    organizationMembers(slug: String!): [User]
  }

  extend type Mutation {
    createOrganization(organization: OrganizationInput!): Organization
    addOrganizationMembership(slug: String!, user_id: String!): User
    revokeOrganizationMembership(slug: String!, user_id: String!): User
    sendAdminInvite(slug: String!, user_id: String!): EmailInvite

    createComplianceTask(slug: String!, complianceTask: ComplianceTaskInput!): ComplianceTask
    updateComplianceTask(slug: String!, complianceTask: ComplianceTaskInput!): ComplianceTask
    deleteComplianceTask(_id: String!): Boolean
  }
`

const Queries = {
  organization: async (_, { slug }, { user, db }) => {
    const org = await db.organizations.findOne({ slug })
    
    // short circuit with fund if superadmin
    if (user.admin) return org

    if (org && user && (user.organizations_admin || []).map(id => id.toString()).includes(org._id.toString())) {
      return org
    }
    throw new AuthenticationError()
  },
  organizationMembers: async (_, { slug }, { user, db }) => {
    isAdmin({user, db})
    const org = await db.organizations.findOne({ slug })

    return db.users.find({ organizations_admin: org._id }).toArray()
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
  },
  addOrganizationMembership: async (_, { slug, user_id }, ctx) => {
    isAdmin(ctx)
    const { _id } = await ctx.db.organizations.findOne({ slug })
    return ctx.db.users.updateOne(
      { _id: ObjectId(user_id) },
      { $push: { organizations_admin: _id } }
    )
  },
  revokeOrganizationMembership: async (_, { slug, user_id }, ctx) => {
    isAdmin(ctx)
    const { _id } = await ctx.db.organizations.findOne({ slug })
    return ctx.db.users.updateOne(
      { _id: ObjectId(user_id) },
      { $pull: { organizations_admin: _id } }
    )
  },
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
  deals: (org, { order_by = "created_at", order_dir = -1 }, { db }) => {
    // default sort order is descending by created_at
    return db.deals
      .find({ organization: org._id })
      .sort({ [order_by]: order_dir })
      .toArray()
  },
  deal: (org, { _id }, { db }) => {
    if (org.slug === "allocations") {
      return db.deals.findOne({ _id: ObjectId(_id), organization: { $in: [org._id, null] }})
    } else {
      return db.deals.findOne({ _id: ObjectId(_id), organization: org._id })
    }
  },
  n_deals: (org, _, { db }) => {
    if (org.slug === "allocations") {
      return db.deals.count({ organization: { $in: [org._id, null] }})
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
      ? { organization: { $in: [org._id, null] }} 
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
  signingRequests: async (org, _, { db, user }) => {
    const reqs = await hellosign.signatureRequest.list()

    const userRequests = reqs.signature_requests.filter(req => {
      return req.test_mode === true 
        && req.signatures.find(s => s.signer_email_address === "willsheehan95@gmail.com")
        && !req.is_complete
        && !req.is_declined
    })

    const formattedUserRequests = userRequests.map(async req => {
      const _id = req.signatures.find(s => s.signer_email_address === "willsheehan95@gmail.com").signature_id
      const { embedded } = await hellosign.embedded.getSignUrl(_id)
      return {
        _id,
        status: req.is_declined ? "declined" : (req.is_complete ? "complete" : "incomplete"),
        title: req.title,
        due: null,
        url: embedded.sign_url
      }
    })

    return Promise.all(formattedUserRequests)
  },
  masterFiling: async (org) => {
    const funds = await gSheets.throttledMasterFund()
    return _.get(funds.find(f => f.name === org.legal_name), 'steps') || []
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
