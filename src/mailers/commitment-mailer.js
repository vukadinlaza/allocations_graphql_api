const moment = require('moment')
const mailer = require('./mailer')
const logger = require('../utils/logger')
const commitmentTemplate = require('./templates/commitment-template')

async function sendNotice (deal, user, investmentAmount) {
  const data = {
    username: user.first_name? `${user.first_name}` : user.email,
    issuer: deal.company_name || '',
    price: '$59',
    totalAmount: `$${investmentAmount}`,
    deadline: moment(deal.dealParams.signDeadline).subtract(2, 'days').format('MMM DD, YYYY')
  }

  const html = commitmentTemplate({ data })

  const msg = {
    to: user.email,
    from: "support@allocations.com",
    subject: `Commitment to invest`,
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
