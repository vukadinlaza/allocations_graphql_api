require('dotenv').config()
const mailer = require('./mailer')
const request = require('request')
const logger = require('../utils/logger')
const spvDocTemplate = require('./spv-doc-template')



const sendSPVDoc = async ({ pdfDownloadUrl, email, deal }) => {

  const html = spvDocTemplate({ deal })

  request(pdfDownloadUrl, { encoding: null }, (err, res, body) => {
    if (err) { return err; }
    if (body) {
      const textBuffered = Buffer.from(body);

      const msg = {
        to: email,
        from: "support@allocations.com",
        subject: `${deal.company_name} - Your Signed Investment Documents`,
        html,
        attachments: [
          {
            content: textBuffered.toString('base64'),
            filename: 'SPV-Documents.pdf',
            type: 'application/pdf',
            disposition: 'attachment',
            content_id: 'mytext',
          },
        ]
      }

      // send msg here

      try {
        mailer.send(msg)
        return { status: "sent", sent_at: Date.now(), to: email }

      } catch (e) {
        logger.error(e)
        return { status: "error" }
      }
    }

  });
}

module.exports = { sendSPVDoc }
