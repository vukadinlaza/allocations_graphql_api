const mailer = require('@sendgrid/mail')
const logger = require('../utils/logger')

// configure with API key
mailer.setApiKey(process.env.SENDGRID_API_KEY)

async function sendInvite ({ deal, user }) {
  const msg = {
    to: "will.sheehan@toptal.com",
    from: "test@example.com",
    subject: `${user.first_name}, you're invited to Participate in the ${deal.company_name} Deal`,
    text: 'Access the deal here ...',
    html: '<strong>Access the deal here ...</strong>'
  }

  // try {
  //   const res = await mailer.send(msg)
  //   return { status: "sent", res }
  // } catch (e) {
  //   logger.error(e)
  //   return { status: "error" }
  // }
}

module.exports = { sendInvite }
