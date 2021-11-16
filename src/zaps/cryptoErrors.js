const fetch = require("node-fetch");

const alertCryptoWalletError = async (portfolio_deal_name, deal_id) => {
  await fetch("https://hooks.zapier.com/hooks/catch/10079430/bh8xw30/", {
    method: "POST",
    body: JSON.stringify({ portfolio_deal_name, deal_id }),
    headers: { "Content-Type": "application/json" },
  });
};

module.exports = { alertCryptoWalletError };
