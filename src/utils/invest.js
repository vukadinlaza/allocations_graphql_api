const fetch = require("node-fetch");

const fetchInvest = async (api, method = "GET", body = {}) => {
  const headers = {
    headers: {
      "X-API-TOKEN": process.env.ALLOCATIONS_TOKEN,
      "Content-Type": "application/json",
    },
    method,
  };
  if (["POST", "PUT", "PATCH"].includes(method))
    headers.body = JSON.stringify(body);

  const res = await fetch(`${process.env.INVEST_API_URL}${api}`, headers);
  const [ok, data] = await Promise.all([res.ok, res.json()]);
  if (!ok) {
    throw data;
  }

  return data;
};

module.exports = {
  fetchInvest,
};
