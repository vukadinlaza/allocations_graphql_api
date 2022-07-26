const { default: fetch } = require("node-fetch");

const requestBuild = async (path, method = "GET", body) => {
  try {
    const fetchHeaders = {
      method,
      headers: {
        "X-API-TOKEN": process.env.ALLOCATIONS_TOKEN,
        "Content-Type": "application/json",
      },
    };

    if (["PUT", "POST"].includes(method))
      fetchHeaders.body = JSON.stringify(body);
    const res = await fetch(
      `${process.env.BUILD_API_URL}${path}`,
      fetchHeaders
    );
    return await res.json();
  } catch {
    return null;
  }
};

module.exports = {
  requestBuild,
};
