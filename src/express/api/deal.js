const { Router } = require("express");

module.exports = Router().post("/", async (req, res) => {
  try {
    return res.send({});
    // const { dealSlug, organizationSlug = "allocations", API_KEY } = req.body;

    // const key = apiKeys.find((k) => k.key === API_KEY);
    // if (!key) {
    //   return res.send({
    //     status: 400,
    //     error: "Invalid API key",
    //   });
    // }

    // const db = await getDB();
    // const organization = await db.organizations.findOne({
    //   slug: organizationSlug,
    // });

    // if (organization !== null && organization._id) {
    //   const deal = await db.deals.findOne({
    //     slug: dealSlug,
    //     organization: organization._id,
    //   });

    //   return res.send(deal);
    // } else {
    //   return res.sendStatus(200);
    // }
  } catch (e) {
    throw new Error(e);
  }
});
