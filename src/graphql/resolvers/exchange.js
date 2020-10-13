const { ObjectId } = require("mongodb")
const { sumBy } = require('lodash')
const { gql } = require('apollo-server-express')
const { isAdmin, isOrgAdmin, ensureFundAdmin } = require('../permissions')
const fetch = require('node-fetch');
const moment = require('moment')

/** 
  
  Handles all exchange related requests
  
 **/

const Schema = gql`
  type ExchangeDeal {
    _id: String
    created_at: Int
    company_name: String
    company_description: String
    date_closed: String
    last_valuation: String
    organization: Organization
    slug: String
    deal: Deal
    volume: Float
    shares: Int
    nTrades: Int
    trades: [Trade]
    orders: [Order]
    matchRequests: [MatchRequest]
  }

  type Trade {
    _id: String
    deal: Deal
    buyer: User
    seller: User
    price: Float
    amount: Float
    side: TradeSide
    investment_id: String
    settled_at: String
    matched_at: String
  }

  enum TradeSide {
    buy
    sell
  }

  type Order {
    _id: String
    user: User
    user_id: String
    side: TradeSide
    order_type: OrderType
    status: OrderStatus
    price: Float
    amount: Float
    created_at: String
    cancelled: Boolean
    cancelled_at: String
    deal_id: String
    investment_id: String
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
    side: TradeSide!
    price: Float
    amount: Float!
    investment_id: String
  }

  type MatchRequest {
    _id: String
    user_id: String
    deal_id: String
    deal: Deal
    order_id: String
    submitted_at: String
    status: MatchRequestStatus
    trade_id: String
    order: Order
    seller: User
    buyer: User
  }

  enum MatchRequestStatus {
    submitted
    accepted
    clearing
    complete
  }

  input TradeInput {
    _id: String
    buyer_id: String
    seller_id: String
    price: Float
    amount: Float
    side: TradeSide
    settled_at: String
    matched_at: String
    deal_id: String
  }

  extend type Mutation {
    createOrder(order: OrderInput!): Order
    cancelOrder(order_id: String!): Order
    newMatchRequest(order_id: String!): MatchRequest
    createTrade(org: String!, trade: TradeInput!): Trade
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
  volume: async (deal, _, { db, user }) => {
    const trades = await db.trades.find({ deal_id: deal._id }).toArray()
    return sumBy(trades, ({ price, amount }) => price * amount)
  },
  nTrades: async (deal, _, { db, user }) => {
    return db.trades.count({ deal_id: deal._id })
  },
  orders: (deal, _, { db, user }) => {
    return db.orders.find({ deal_id: deal._id, status: "open" }).toArray()
  },
  matchRequests: async (deal, _, { db, user }) => {
    const reqs = await db.matchrequests.find({ deal_id: deal._id, user_id: user._id, status: { $ne: "complete" } }).toArray()

    for (let i = 0; i < reqs.length; i++) {
      reqs[i].order = await db.orders.findOne({ _id: reqs[i].order_id })
    }
    return reqs
  }
}

const Trade = {
  buyer: ({ buyer_id }, _, { db }) => db.users.findOne({ _id: buyer_id }),
  seller: ({ seller_id }, _, { db }) => db.users.findOne({ _id: seller_id }),
  deal: ({ deal_id }, _, { db }) => db.deals.findOne({ _id: deal_id }),
}

const MatchRequest = {
  order: (matchRequest, _, { db }) => {
    return db.orders.findOne({ _id: matchRequest.order_id })
  },
  seller: async (matchRequest, _, ctx) => {
    const order = await ctx.db.orders.findOne({ _id: matchRequest.order_id })
    if (order.side === "ask") {
      return ctx.db.users.findOne({ _id: order.user_id })
    }
    return ctx.db.users.findOne({ _id: matchRequest.user_id })
  },
  buyer: async (matchRequest, _, ctx) => {
    const order = await ctx.db.orders.findOne({ _id: matchRequest.order_id })
    if (order.side === "bid") {
      return ctx.db.users.findOne({ _id: order._id })
    }
    return ctx.db.users.findOne({ _id: matchRequest.user_id })
  },
  deal: ({ deal_id }, _, { db }) => {
    return db.deals.findOne({ _id: deal_id })
  }
}

const Mutations = {
  /** Add order w/ proper associations **/
  createOrder: async (_, { order: { deal_id, ...order } }, ctx) => {
    isAdmin(ctx)
    // TODO => check that user has sufficient inventory

    const deal = await ctx.db.deals.findOne({ _id: ObjectId(deal_id) })

    const body = {
      ...order,
      user_id: ObjectId(ctx.user._id),
      organization_id: deal.organization,
      side: order.side,
      deal_id: deal._id,
      created_at: Date.now(),
      status: "open",
      amount: order.amount,
      cancelled: false,
      investment_id: order.investment_id
    }
    console.log('BODY', body)
    const orderRes = await ctx.db.orders.insertOne({ ...body })

    const webhookRes = await fetch('https://hooks.zapier.com/hooks/catch/7904699/ogkbkqd', {
      method: 'post',
      body: JSON.stringify({
        ...body,
        email: ctx.user.email,
        deal: deal.company_name,
        date: moment(body.created_at).format('MM/DD/YYYY'),
        fullName: `${ctx.user.first_name || null} ${ctx.user.last_name || null} `
      }),
      headers: { 'Content-Type': 'application/json' },
    })
    return orderRes
  },
  /** cancels order, so that it can no longer be matched **/
  cancelOrder: (_, { order_id }, ctx) => {
    isAdmin(ctx)

    return ctx.db.orders.updateOne(
      { _id: ObjectId(order_id) },
      { $set: { cancelled: true, status: "cancelled" } }
    )
  },
  /** creates match request that musts be approved to create a trade **/
  newMatchRequest: async (_, { order_id }, ctx) => {
    isAdmin(ctx)

    const order = await ctx.db.orders.findOne({ _id: ObjectId(order_id) })
    const res = await ctx.db.matchrequests.insertOne({
      order_id: order._id,
      organization_id: order.organization_id,
      deal_id: order.deal_id,
      user_id: ctx.user._id,
      submitted_at: Date.now(),
      status: "submitted"
    })
    return res.ops[0]
  },
  /** creates and settles a trade -> TODO add balance transfer **/
  createTrade: async (_, { amount, requester, investment_id, type, deal_id }, ctx) => {
    const org = await ensureFundAdmin(orgSlug, ctx)

    return ctx.db.trades.insertOne({
      ...trade,
      deal_id: ObjectId(deal_id),
      buyer_id: ObjectId(buyer_id),
      seller_id: ObjectId(seller_id),
      organization_id: org._id
    })
  }
}

const Queries = {
  exchangeDeals: (_, __, ctx) => {
    isAdmin(ctx)
    return ctx.db.deals.find({ status: "closed", no_exchange: { $ne: true } }).toArray()
  },
  exchangeDeal: (_, { slug }, ctx) => {
    isAdmin(ctx)
    return ctx.db.deals.findOne({ slug })
  },
  matchRequests: async (_, { org: orgSlug }, ctx) => {
    const org = await ensureFundAdmin(orgSlug, ctx)
    return ctx.db.matchrequests.find({ organization_id: org._id }).toArray()
  }
}

module.exports = {
  Schema,
  Queries,
  Mutations,
  subResolvers: { ExchangeDeal, MatchRequest, Trade }
}
