const { createLogger, logdnaClient } = require("@allocations/logger");
const logdna = require("@logdna/logger");
const shouldSendLogs = process.env.NODE_ENV === "production";

const loggerOptions = {
  app: "allocations-graphql-api",
  key: process.env.LOGDNA_KEY,
};

const dnaLogger = logdna.createLogger(loggerOptions.key, loggerOptions);
// logger simply logs to console
const logger = createLogger("graphql-api");
// appLogger is used to log to console & send logs to logDNA
const appLogger = logdnaClient(dnaLogger, logger);

module.exports = { appLogger, shouldSendLogs, logger };
