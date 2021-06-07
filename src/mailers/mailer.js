const mailer = require('@sendgrid/mail')
const moment = require('moment')
const logger = require('../utils/logger')


// configure with API key
// mailer.setApiKey(process.env.SENDGRID_API_KEY)
mailer.setApiKey('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')


async function sendEmail ({mainData, template, templateData}) {
  const html = template(templateData)

  const msg = {...mainData, html}
  try {
    await mailer.send(msg)
    return { status: "sent", sent_at: Date.now(), to: mainData.to }
  } catch (e) {
    logger.error(e)
    return { status: "error" }
  }
}

module.exports = { sendEmail, mailer }
