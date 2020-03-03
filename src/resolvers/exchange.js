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
  }

  enum TradeSide {
    buy
    sell
  }

  type Order {
    _id: String
    user: User
    side: OrderSide
    price: Float
    amount: Float
    created_at: Int
    cancelled: Boolean
    cancelled_at: Int
  }

  enum OrderSide {
    bid
    ask
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

module.exports = { Schema, Queries, ExchangeDeal }