const mailer = require('./mailer')
const logger = require('../utils/logger')
const dealInviteTemplate = require('./deal-invite-template')
const { subResolvers: { User } } = require('../graphql/resolvers/investors')

async function sendInvite ({ deal, sender, to, org }) {
  sender.name = User.name(sender)
  const link = `https://dashboard.allocations.com/public/${org.slug}/deals/${deal.slug}?invite_code=${deal.inviteKey}`
  const html = dealInviteTemplate({ deal, sender, org, link })

  const msg = {
    to,
    from: "invites@allocations.com",
    subject: `${org.name} has invited you to Participate in the ${deal.company_name} SPV`,
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
