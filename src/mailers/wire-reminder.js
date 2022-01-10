const Mailer = require("./mailer");
const { logger } = require("../utils/logger");
const wireReminderTemplate = require("./templates/wire-reminder-template");

const sendWireReminderEmail = async ({
  email,
  name,
  company_name,
  deal_slug,
  investmentAmount,
  org_slug,
}) => {
  const emailData = {
    mainData: {
      to: email,
      from: "support@allocations.com",
      subject: `${company_name} - Wire Reminder`,
    },
    template: wireReminderTemplate,
    templateData: {
      email,
      name,
      company_name,
      investmentAmount,
      deal_slug,
      org_slug,
    },
  };

  try {
    await Mailer.sendEmail(emailData);
    return { status: "Email Sent", sent_at: Date.now(), to: email };
  } catch (e) {
    logger.error(e);
    return { status: "Unable to send email." };
  }
};

module.exports = { sendWireReminderEmail };
