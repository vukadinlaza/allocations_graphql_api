const moment = require('moment')
const mailer = require('./mailer')
const logger = require('../utils/logger')
const commitmentCancelledTemplate = require('./templates/commitment-cancelled-template')

async function sendNotice (deal, user, investment, reason) {
  const data = {
    username: user.first_name? `${user.first_name}` : user.email,
    issuer: deal.company_name || '',
    reason,
    refundAmount: `$${investment.amount}`,
    refundDate: moment(new Date()).add(2, 'days').format('MMM DD, YYYY')
  }

  const html = commitmentCancelledTemplate({ data })

  const msg = {
    to: user.email,
    from: "support@allocations.com",
    subject: `Commitment Cancelled`,
    text: `Access the deal here ... LINK`,
    html
  }

  try {
    await mailer.send(msg)
    return { status: "sent", sent_at: Date.now(), to: user.email }
  } catch (e) {
    logger.error(e)
    return { status: "error" }
  }
}

module.exports = { sendNotice }
