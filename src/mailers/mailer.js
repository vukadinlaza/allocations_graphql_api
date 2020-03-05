const mailer = require('@sendgrid/mail')

// configure with API key
mailer.setApiKey(process.env.SENDGRID_API_KEY)

module.exports = mailer