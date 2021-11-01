const { subMerchant, payment } = require("./forumPay");
const { signedSPV, wFormSigned } = require("./signedDocs");

module.exports = { subMerchant, payment, signedSPV, wFormSigned };
