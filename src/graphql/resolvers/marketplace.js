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
type Like { 
    name: String
    round: String
  }
input MarketplaceLikeInput {
    name: String!
    round: String!
  }  

extend type Mutation {
    createMarketplaceLike(like: MarketplaceLikeInput!): Like
  }
`
const Like = {}

const Mutations = {
  /** Add order w/ proper associations **/
  createMarketplaceLike: async (_, body, ctx) => {
    // TODO => check that user has sufficient inventory
    console.log(body)
    // const deal = await ctx.db.deals.findOne({ _id: ObjectId(deal_id) })

//     const body = {
//       ...like,
//       created_at: Date.now(),
//       name: like.name,
//       round: 'test',
//     }
//     // console.log('BODY', body)
//     // const orderRes = await ctx.db.orders.insertOne({ ...body })

    const webhookRes = await fetch('https://hooks.zapier.com/hooks/catch/7837448/oqbxyfu', {
      method: 'post',
      body: JSON.stringify({
        ...body,
            user: ctx.user.email,
            name: body.like.name,
            round: body.like.round,
            date: moment(body.created_at).format('MM/DD/YYYY'),
            fullName: `${ctx.user.first_name || null} ${ctx.user.last_name || null} `
      }),
      headers: { 'Content-Type': 'application/json' },
    })
    return {}
   },
}

const Queries = {

}

module.exports = {
  Schema,
  Queries,
  Mutations,
  subResolvers: { Like }
}
