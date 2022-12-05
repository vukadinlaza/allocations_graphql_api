const { Router } = require("express");

module.exports = Router().post("/", (req, res, next) => {
  try {
    res.send({ acknowledged: true });
  } catch (e) {
    next(e);
  }
});
