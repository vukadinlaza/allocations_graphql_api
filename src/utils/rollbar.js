const Rollbar = require("rollbar")

const { ROLLBAR_ACCESS_TOKEN } = process.env

module.exports = new Rollbar(ROLLBAR_ACCESS_TOKEN)