const fetch = require("node-fetch");

const subMerchant = async ({ user }) => {
  await fetch("https://hooks.zapier.com/hooks/catch/10079430/bh8xw30/", {
    method: "POST",
    body: JSON.stringify({ user }),
    headers: { "Content-Type": "application/json" },
  });
};

const payment = async ({
  pos_id,
  currency,
  payment_id,
  reference_no,
  address,
}) => {
  await fetch("https://hooks.zapier.com/hooks/catch/10079430/bhdya2a/", {
    method: "POST",
    body: JSON.stringify({
      pos_id,
      currency,
      payment_id,
      reference_no,
      address,
    }),
    headers: { "Content-Type": "application/json" },
  });
};

module.exports = {
  subMerchant,
  payment,
};
