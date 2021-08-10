require("dotenv").config();
const { Router } = require("express");
const { getDB } = require("../../mongo/index");

const apiKeys = [{ key: process.env.DEAL_IMG_KEY }];

module.exports = Router().post("/", async (req, res, next) => {
  try {
    const { dealSlug, organizationSlug = "allocations", API_KEY } = req.body;

    const key = apiKeys.find((k) => k.key === API_KEY);
    if (!key) {
      return res.send({
        status: 400,
        error: "Invalid API key",
      });
    }

    const db = await getDB();
    const organization = await db.organizations.findOne({
      slug: organizationSlug,
    });

    if (organization !== null && organization._id) {
      const deal = await db.deals.findOne({
        slug: dealSlug,
        organization: organization._id,
      });

      return res.send(deal);
    } else {
      return res.sendStatus(200);
    }
  } catch (e) {
    throw new Error(e);
  }
});
