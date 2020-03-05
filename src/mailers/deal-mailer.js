const mailer = require('./mailer')
const logger = require('../utils/logger')
const dealInviteTemplate = require('./deal-invite-template')
const { User } = require('../resolvers/investors')

async function sendInvite ({ deal, sender, to, org }) {
  sender.name = User.name(sender)
  const link = `https://dashboard.allocations.com/public/${org.slug}/deals/${deal.company_name}?invite_code=${deal.inviteKey}`
  const html = dealInviteTemplate({ deal, sender, org, link })

  const msg = {
    to,
    from: "invites@allocations.co",
    subject: `${org.name} has invited to Participate in the ${deal.company_name} Deal`,
    text: `Access the deal here ... ${link}`,
    html
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
