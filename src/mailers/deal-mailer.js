const mailer = require('@sendgrid/mail')
const logger = require('../utils/logger')

// configure with API key
mailer.setApiKey(process.env.SENDGRID_API_KEY)

async function sendInvite ({ deal, sender, to, org }) {

  const link = `dashboard.allocations.com/public/${org.slug}/${deal.company_name}?invite_code=${deal.inviteKey}`

  const msg = {
    to,
    from: "invites@allocations.co",
    subject: `${org.name} has invited to Participate in the ${deal.company_name} Deal`,
    text: `Access the deal here ... ${link}`,
    html: `
      <div>
        <h4>${org.name} has invited you to Participate in the ${deal.company_name} Deal</h4>
        <p><a href="${link}">Deal information and Onboarding</a></p> 
      </div>
    `
  }

  try {
    const res = await mailer.send(msg)
    return { status: "sent", sent_at: Date.now(), to }
  } catch (e) {
    logger.error(e)
    return { status: "error" }
  }
}

module.exports = { sendInvite }
