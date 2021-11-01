const { Router } = require("express");
const { subMerchant, payment } = require("../../zaps");
const logger = require("../../utils/logger");

module.exports = Router()
  .post("/sub-merchant", async (req, res, next) => {
    try {
      await subMerchant(req.body);
      res.sendStatus(200);
    } catch (error) {
      logger.error(error);
      next(error);
    }
  })
  .post("/payment", async (req, res, next) => {
    try {
      await payment(req.body);
      res.sendStatus(200);
    } catch (error) {
      logger.error(error);
      next(error);
    }
  });
