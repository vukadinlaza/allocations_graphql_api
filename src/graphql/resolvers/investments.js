const { ObjectId } = require("mongodb")
const moment = require('moment');
const { isNumber, forEach, get } = require('lodash')
const { isAdmin, isAdminOrSameUser } = require('../permissions')
const { AuthenticationError } = require('apollo-server-express')
const Cloudfront = require('../../cloudfront')
const Uploader = require('../../uploaders/investor-docs')
const Investments = require('../schema/investments')
const { getInvestmentPreview, getTemplate } = require("../../docspring")
const { signForInvestment } = require('../../zaps/signedDocs')
const Mailer = require('../../mailers/mailer')
const commitmentTemplate = require('../../mailers/templates/commitment-template')
const commitmentCancelledTemplate = require('../../mailers/templates/commitment-cancelled-template')
const { signedSPV } = require('../../zaps/signedDocs')

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
  },
  investmentsList: (_, args, ctx) => {
    const { pagination, currentPage, filterField, filterValue, filterNestedKey, filterNestedCollection, filterLocalFieldKey, sortField, sortOrder, sortNestedKey, sortNestedCollection, sortLocalFieldKey } = args.pagination;

    isAdmin(ctx)

    const documentsToSkip = pagination * (currentPage)
    const match = {};
    if(filterValue){
      let field = filterNestedKey? `${filterField}.${filterNestedKey}` : filterField;
      match[field] = { "$regex" : `/*${filterValue}/*` , "$options" : "i"}
    }
    let sortBy = {};
    sortBy[`${sortNestedKey? `${sortField}.${sortNestedKey}` : (sortField? sortField : filterField)}`] = (sortOrder? sortOrder : 1)

    let aggregation = []
    if(sortNestedKey && sortNestedCollection && sortLocalFieldKey) aggregation.push({
      $lookup: {
        from: sortNestedCollection,
        localField: sortLocalFieldKey,
        foreignField: '_id',
        as: sortField
      }
    })
    if(filterNestedKey && filterNestedCollection && filterLocalFieldKey) aggregation.push({
      $lookup: {
        from: filterNestedCollection,
        localField: filterLocalFieldKey,
        foreignField: '_id',
        as: filterField
      }
    })

    aggregation.push({$match: match})
    if(sortField && sortOrder) aggregation.push({$sort: sortBy})

    let query = ctx.db.collection("investments")
                      .aggregate(aggregation)
                      .skip(documentsToSkip)
                      .limit(pagination)
                      .toArray()
    return query;
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
    const status = get(deal, 'status');

    if (deal !== null && deal.isDemo === true) {
      return { _id: 'mockDemoInvestmentID' }
    } else if (signDeadline) {
      const isClosed = status === 'closed';
      if (isClosed) throw new Error("The deal selected is closed.");
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

    const downloadUrl = await getTemplate({
      db,
      deal,
      payload: { ...payload, investmentId: investment._id },
      user,
      templateId: payload.docSpringTemplateId,
      investmentDocs: investment.documents,
      investmentStatus: investment.status
    })

    await db.deals.updateOne({ _id: ObjectId(deal._id) }, {
      $pull: { usersViewed: ObjectId(user._id) }
    })

    const emailData = {
      mainData: {
        to: user.email,
        from: "support@allocations.com",
        subject: `Commitment to invest`,
      },
      template: commitmentTemplate,
      templateData: {
        username: user.first_name? `${user.first_name}` : user.email,
        issuer: deal.company_name || '',
        price: '$59',
        totalAmount: `$${payload.investmentAmount}`,
        deadline: moment(deal.dealParams.signDeadline).subtract(2, 'days').format('MMM DD, YYYY')
      }
    }
    if (deal && deal.slug === 'luna-mega') {
      await Mailer.sendEmail(emailData)
    }

    const zapData = {
      ...investment,
      dealName: deal.company_name,
      downloadUrl
    }
    await signedSPV(zapData)

    return db.investments.findOne({ _id: ObjectId(investment._id) })
  },
  getInvestmentPreview: async (_, { payload }, { user, db }) => {
    const res = await getInvestmentPreview({ input: payload, templateId: payload.docSpringTemplateId, user })
    return { ...user, previewLink: res.download_url }
  },

  cancelCommitment: async (_, { _id, reason }, { user, db }) => {
    try {
      const investment = await db.investments.findOne({ _id: ObjectId(_id) })
      if (!investment) return false

      const deal = await db.deals.findOne({ _id: ObjectId(investment.deal_id) })
      let res = await db.investments.deleteOne({ _id: ObjectId(_id) })

      const emailData = {
        mainData: {
          to: user.email,
          from: "support@allocations.com",
          subject: `Commitment Cancelled`,
        },
        template: commitmentCancelledTemplate,
        templateData: {
          username: user.first_name? `${user.first_name}` : user.email,
          issuer: deal.company_name || '',
          reason,
          refundAmount: `$${investment.amount}`,
          refundDate: moment(new Date()).add(2, 'days').format('MMM DD, YYYY')
        }
      }

      await Mailer.sendEmail(emailData)
      return res.deletedCount === 1
    } catch (e) {
      return false
    }
  }
}

module.exports = {
  Schema,
  Queries,
  Mutations,
  subResolvers: { Investment }
}
