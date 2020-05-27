const { ObjectId } = require("mongodb")
const { isAdmin, isAdminOrSameUser } = require('../graphql/permissions')
const { gql, AuthenticationError } = require('apollo-server-express')

const Cloudfront = require('../cloudfront')
const Uploader = require('../uploaders/investor-docs')

/** 

  handles all the investment flow

 **/

const Schema = gql`
  type Investment {
    _id: String

    invited_at: Int
    pledged_at: Int
    onboarded_at: Int
    completed_at: Int

    organization: String
    amount: Int
    deal: Deal
    user: User
    status: InvestmentStatus
    documents: [Document]
    investor: User
  }

  enum InvestmentStatus {
    invited
    pledged
    onboarded
    complete
  }

  extend type Query {
    investment(_id: String): Investment
    allInvestments: [Investment]
  }

  extend type Mutation {
    createInvestment(investment: InvestmentInput!): Investment
    updateInvestment(investment: InvestmentInput!): Investment
    deleteInvestment(_id: String!): Boolean

    addInvestmentDoc(investment_id: String!, doc: Upload!): String
    rmInvestmentDoc(investment_id: String!, file: String!): Boolean
  }

  input InvestmentInput {
    _id: String
    amount: Int
    deal_id: String
    user_id: String
    status: String
    documents: String
  }
`

const Investment = {
  deal: (investment, _, { db }) => {
    return db.collection("deals").findOne({ _id: investment.deal_id })
  },
  investor: (investment, _, { db }) => {
    return db.collection("users").findOne({ _id: investment.user_id })
  },
  documents: (investment) => {
    if (Array.isArray(investment.documents)) {
      return investment.documents.map(path => {
        return { link: Cloudfront.getSignedUrl(path), path }
      })
    } else {
      return []
    }
  }
}

const Queries = {
  investment: (_, args, ctx) => {
    isAdmin(ctx)
    return ctx.db.investments.findOne({ _id: ObjectId(args._id) })
  },
  allInvestments: (_, __, ctx) => {
    isAdmin(ctx)
    return db.investments.find({}).toArray()
  }
}

const Mutations = {
  /** inits investment with appropriate status **/
  createInvestment: async (_, { investment: { user_id, deal_id, ...investment }}, { user, db }) => {
    const deal = await db.collection("deals").findOne({ _id: ObjectId(deal_id) })

    // superadmin OR all are invited OR is org admin
    if (user.admin || deal.allInvited || user.orgs.find(o => o._id.toString() === deal.organization.toString())) {
      const res = await db.investments.insertOne({
        status: "invited",
        invited_at: Date.now(),
        [`${investment.status}_at`]: Date.now(),
        ...investment,
        user_id: ObjectId(user_id),
        deal_id: ObjectId(deal_id),
        organization: ObjectId(deal.organization)
      })
      return res.ops[0]
    }
    throw new AuthenticationError('permission denied');
  },
  /** updates investment and tracks the status change **/
  updateInvestment: async (_, { org, investment: { _id, ...investment }}, ctx) => {
    isAdmin(ctx)

    // we need to track status changes
    const savedInvestment = await ctx.db.investments.findOne({ _id: ObjectId(_id) })
    if (savedInvestment.status !== investment.status) {
      investment[`${investment.status}_at`] = Date.now()
    }

    return ctx.db.investments.updateOne(
      { _id: ObjectId(_id) },
      { $set: investment }
    )
  },
  /** delete investment **/
  deleteInvestment: async (_, { _id }, ctx) => {
    isAdmin(ctx)

    try {
      const res = await ctx.db.investments.deleteOne({ _id: ObjectId(_id) })
      return res.deletedCount === 1
    } catch (e) {
      return false
    }
  },

  // Document Handling

  /** uploads investment document, S3 & db path **/
  addInvestmentDoc: async (_, {investment_id, doc}, ctx) => {
    isAdmin(ctx)

    const file = await doc
    const s3Path = await Uploader.putInvestmentDoc(investment_id, file)

    await ctx.db.investments.updateOne(
      { _id: ObjectId(investment_id) },
      { $addToSet: { documents: s3Path } }
    )

    return Cloudfront.getSignedUrl(s3Path)
  },
  /** deletes investment document, S3 & db path **/
  rmInvestmentDoc: async (_, {investment_id, file}, ctx) => {
    isAdmin(ctx)

    await Uploader.rmInvestmentDoc(investment_id, file)
    await ctx.db.investments.updateOne(
      { _id: ObjectId(investment_id) },
      { $pull: { documents: `investments/${investment_id}/${file}` } }
    )

    return true
  }
}

module.exports = { 
  Schema,
  Queries, 
  Mutations, 
  subResolvers: { Investment }
}
