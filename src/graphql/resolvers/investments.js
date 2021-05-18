const { ObjectId } = require("mongodb")
const moment = require('moment');
const { isNumber, forEach, get } = require('lodash')
const { isAdmin, isAdminOrSameUser } = require('../permissions')
const { AuthenticationError } = require('apollo-server-express')
const Cloudfront = require('../../cloudfront')
const Uploader = require('../../uploaders/investor-docs')
const Investments = require('../schema/investments')
const { getTemplate, getInvestmentPreview } = require("../../docspring")
const { signForInvestment } = require('../../zaps/signedDocs')

/**

  handles all the investment flow

 **/

const Schema = Investments

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
  },
  value: async (investment, _, { db }) => {
    const deal = await db.collection('deals').findOne({ _id: investment.deal_id })
    const multiple = parseInt((deal.dealParams.dealMultiple || '1'))
    const value = investment.amount * multiple
    return value
  }
}

const Queries = {
  investment: (_, args, ctx) => {
    return ctx.db.investments.findOne({ _id: ObjectId(args._id) })
  },
  allInvestments: (_, __, ctx) => {
    return db.investments.find({}).toArray()
  }
}

const Mutations = {
  /** inits investment with appropriate status **/
  createInvestment: async (_, { investment: { user_id, deal_id, ...investment } }, { user, db }) => {
    const deal = await db.collection("deals").findOne({ _id: ObjectId(deal_id) })

    // superadmin OR all are invited OR is org admin
    // if (user.admin || deal.allInvited || user.orgs.find(o => o._id.toString() === deal.organization.toString())) {
    const res = await db.investments.insertOne({
      status: "invited",
      invited_at: Date.now(),
      created_at: Date.now(),
      [`${investment.status}_at`]: Date.now(),
      ...investment,
      user_id: ObjectId(user_id),
      deal_id: ObjectId(deal_id),
      organization: ObjectId(deal.organization)
    })
    return res.ops[0]
    // }
    throw new AuthenticationError('permission denied');
  },
  /** updates investment and tracks the status change **/
  updateInvestment: async (_, { org, investment: { _id, ...investment } }, ctx) => {
    // we need to track status changes
    const savedInvestment = await ctx.db.investments.findOne({ _id: ObjectId(_id) })
    if (savedInvestment.status !== investment.status) {
      investment[`${investment.status}_at`] = Date.now()
    }
    return ctx.db.investments.updateOne(
      { _id: ObjectId(_id) },
      { $set: { ...investment, updated_at: Date.now() } },
      { "new": true }
    )
  },
  /** delete investment **/
  deleteInvestment: async (_, { _id }, ctx) => {

    try {
      const res = await ctx.db.investments.deleteOne({ _id: ObjectId(_id) })
      return res.deletedCount === 1
    } catch (e) {
      return false
    }
  },

  // Document Handling

  /** uploads investment document, S3 & db path **/
  addInvestmentDoc: async (_, { investment_id, doc, isK1 }, ctx) => {

    const file = await doc
    const s3Path = await Uploader.putInvestmentDoc(investment_id, file, isK1)

    await ctx.db.investments.updateOne(
      { _id: ObjectId(investment_id) },
      { $addToSet: { documents: s3Path } }
    )

    return Cloudfront.getSignedUrl(s3Path)
  },
  /** deletes investment document, S3 & db path **/
  rmInvestmentDoc: async (_, { investment_id, file }, ctx) => {

    await Uploader.rmInvestmentDoc(investment_id, file)
    await ctx.db.investments.updateOne(
      { _id: ObjectId(investment_id) },
      { $pull: { documents: `investments/${investment_id}/${file}` } }
    )

    return true
  },

  confirmInvestment: async (_, { payload }, { user, db }) => {

    const deal = await db.deals.findOne({ _id: ObjectId(payload.dealId) })

    const signDeadline = get(deal, 'dealParams.signDeadline');

    if (deal !== null && deal.isDemo === true) {
      return { _id: 'mockDemoInvestmentID' }
    }else if(signDeadline){
      const isClosed = moment(signDeadline).add(2, 'days').isBefore(new Date());
      if(isClosed) throw new Error("The deal selected is closed.");
    }
    
    let investment = null
    if (!payload.investmentId) {
      const invsRes = await db.investments.insertOne({
        status: "invited",
        invited_at: Date.now(),
        created_at: Date.now(),
        amount: parseFloat(payload.investmentAmount.replace(/,/g, '')),
        user_id: ObjectId(user._id),
        deal_id: ObjectId(payload.dealId),
        organization: ObjectId(deal.organization),
        submissionData: payload
      })
      investment = invsRes.ops[0]
    } else {

      investment = await db.investments.findOne({ _id: ObjectId(payload.investmentId) })
      const x = { ...investment.submissionData, ...payload }
      await db.investments.updateOne({ _id: ObjectId(investment._id) }, { $set: { submissionData: x } })
    }
    getTemplate({ db, deal, payload: { ...payload, investmentId: investment._id }, user, templateId: payload.docSpringTemplateId, investmentDocs: investment.documents, investmentStatus: investment.status })
    await db.deals.updateOne({ _id: ObjectId(deal._id) }, {
      $pull: { usersViewed: ObjectId(user._id) }
    })
    await signForInvestment(investment)
    return db.investments.findOne({ _id: ObjectId(investment._id) })
  },
  getInvestmentPreview: async (_, { payload }, { user, db }) => {
    const res = await getInvestmentPreview({ input: payload, templateId: payload.docSpringTemplateId, user })
    return { ...user, previewLink: res.download_url }
  }
}

module.exports = {
  Schema,
  Queries,
  Mutations,
  subResolvers: { Investment }
}
