const { mailer } = require("./mailer");
const request = require("request");
const { logger } = require("../utils/logger");
const spvDocTemplate = require("./spv-doc-template");

const sendSPVDoc = async (spvDocData) => {
  try {
    const { pdfDownloadUrl, email, deal, orgName } = spvDocData;
    const html = spvDocTemplate({ orgName });

    const successful = function (response) {
      return response.statusCode >= 200 && response.statusCode < 300;
    };

    request(pdfDownloadUrl, { encoding: null }, (err, res, body) => {
      if (err) {
        logger.error(err);
        return err;
      } else if (!successful(res)) {
        logger.error(err);
        return err;
      }

      if (successful(res)) {
        const textBuffered = Buffer.from(body);
        const msg = {
          to: email,
          from: "support@allocations.com",
          subject: `${deal.company_name} - Your Signed Investment Documents`,
          html,
          attachments: [
            {
              content: textBuffered.toString("base64"),
              filename: "SPV-Documents.pdf",
              type: "application/pdf",
              disposition: "attachment",
              content_id: "mytext",
            },
          ],
        };

        mailer.send(msg);
        return { status: "sent", sent_at: Date.now(), to: email };
      }
    });
  } catch (e) {
    logger.error(e);
    return { status: "error" };
  }
};

module.exports = { sendSPVDoc };
