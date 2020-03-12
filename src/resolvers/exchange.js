const { ObjectId } = require("mongodb")
const { gql } = require('apollo-server-express')
const { isAdmin, isOrgAdmin } = require('../graphql/permissions')
const Cloudfront = require('../cloudfront')
const DealDocUploader = require('../uploaders/deal-docs')
const DealMailer = require('../mailers/deal-mailer')
const logger = require('../utils/logger')
const { AuthenticationError } = require('apollo-server-express')

const Schema = gql`
  type ExchangeDeal {
    _id: String
    created_at: Int
    company_name: String
    company_description: String
    organization: Organization
    slug: String
    deal: Deal
    shares: Int
    trades: [Trade]
    orders: [Order]
    matchRequests: [MatchRequest]
  }

  type Trade {
    _id: String
    buyer: User
    seller: User
    price: Float
    amount: Float
    side: TradeSide
    settled_at: Int
    matched_at: Int
    deal_id: String
  }

  enum TradeSide {
    buy
    sell
  }

  type Order {
    _id: String
    user: User
    user_id: String
    side: OrderSide
    order_type: OrderType
    status: OrderStatus
    price: Float
    amount: Float
    created_at: String
    cancelled: Boolean
    cancelled_at: String
    deal_id: String
  }

  enum OrderStatus {
    open
    filled
    partiallyfilled
    cancelled
  }

  enum OrderType {
    limit
    market
  }

  enum OrderSide {
    bid
    ask
  }

  input OrderInput {
    _id: String
    user_id: String!
    deal_id: String!
    side: OrderSide!
    price: Float!
    amount: Float!
  }

  type MatchRequest {
    _id: String
    user_id: String
    deal_id: String
    order_id: String
    submitted_at: String
    status: MatchRequestStatus
    trade_id: String
    order: Order
  }

  enum MatchRequestStatus {
    submitted
    accepted
    clearing
    complete
  }

  extend type Mutation {
    createOrder(order: OrderInput!): Order
    cancelOrder(order_id: String!): Order
    newMatchRequest(order_id: String!): MatchRequest
  }

  extend type Query {
    exchangeDeals: [ExchangeDeal]
    exchangeDeal(slug: String!): ExchangeDeal
    matchRequests(org: String!): [MatchRequest]
  }
`

const slugify = (str) => str.toLowerCase().replace(' ', '-')

const ExchangeDeal = {
  slug: (deal, _, { db }) => deal.slug || slugify(deal.company_name),
  organization: (deal, _, { db }) => {
    return db.organizations.findOne({ _id: deal.organization })
  },
  shares: async (deal, _, { db, user }) => {
    const investments = await db.investments.find({ 
      user_id: ObjectId(user._id),
      deal_id: deal._id,
      status: "complete"
    }).toArray()

    return investments.reduce((a, x) => a + x.amount, 0)
  },
  orders: (deal, _, { db, user }) => {
    return db.orders.find({ deal_id: deal._id.toString(), status: "open" }).toArray()
  },
  matchRequests: async (deal, _, { db, user }) => {
    const reqs = await db.matchrequests.find({ deal_id: deal._id.toString(), user_id: user._id, status: { $ne: "complete" } }).toArray()

    for (let i = 0; i < reqs.length; i++) {
      reqs[i].order = await db.orders.findOne({ _id: reqs[i].order_id })
    }
    return reqs
  }
}

const Mutations = {
  createOrder: async (_, { order }, ctx) => {
    isAdmin(ctx)
    // TODO => check that user has sufficient inventory

    const res = await ctx.db.orders.insertOne({
      ...order,
      created_at: Date.now(),
      status: "open",
      cancelled: false
    })
    return res.ops[0]
  },
  cancelOrder: (_, { order_id }, ctx) => {
    isAdmin(ctx)

    return ctx.db.orders.updateOne(
      { _id: ObjectId(order_id) },
      { $set: { cancelled: true, status: "cancelled" } }
    )
  },
  newMatchRequest: async (_, { order_id }, ctx) => {
    isAdmin(ctx)

    const order = await ctx.db.orders.findOne({ _id: ObjectId(order_id) })
    const res = await ctx.db.matchrequests.insertOne({
      order_id: order._id,
      deal_id: order.deal_id,
      user_id: ctx.user._id,
      submitted_at: Date.now(),
      status: "submitted"
    })
    return res.ops[0]
  }
}

const Queries = {
  exchangeDeals: (_, __, ctx) => {
    isAdmin(ctx)
    return ctx.db.deals.find({}).toArray()
  },
  exchangeDeal: (_, { slug }, ctx) => {
    isAdmin(ctx)
    return ctx.db.deals.findOne({ slug })
  },
  matchRequests: async (_, { org }, ctx) => {
    const organization = isOrgAdmin(org, ctx)
    const deals = await ctx.db.deals.find({ organization }).toArray()

    const requests = []
    for (let i = 0; i < deals.length; i ++) {
      const deal = deals[i]
      const reqs = await ctx.db.matchRequests.find({ deal_id: deal._id }).toArray()
      requests.push(reqs) 
    }
    return requests
  }
}

module.exports = { Schema, Queries, ExchangeDeal, Mutations }