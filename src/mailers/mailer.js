const mailer = require("@sendgrid/mail");
const { logger } = require("../utils/logger");

// configure with API key
mailer.setApiKey(process.env.SENDGRID_API_KEY);

async function sendEmail(data, cc = true) {
  // typescript_fixes_this
  if (!data | !data?.template) {
    return { status: "error" };
  }
  try {
    const { mainData, template, templateData } = data;
    const html = template(templateData);
    const msg = { ...mainData, html };

    await mailer.send(msg, cc);
    return { status: "sent", sent_at: Date.now(), to: mainData.to };
  } catch (e) {
    logger.error(e);
    return { status: "error", message: e.message };
  }
}

module.exports = { sendEmail, mailer };
