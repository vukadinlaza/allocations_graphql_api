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

  extend type Mutation {
    createOrder(order: OrderInput!): Order
    cancelOrder(order_id: String!): Order
  }

  extend type Query {
    exchangeDeals: [ExchangeDeal]
    exchangeDeal(slug: String!): ExchangeDeal
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
    // return db.orders.find({}).toArray()
    return db.orders.find({ deal_id: deal._id.toString(), status: "open" }).toArray()
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
  }
}

module.exports = { Schema, Queries, ExchangeDeal, Mutations }