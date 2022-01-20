const { appLogger, shouldSendLogs } = require("../utils/logger");
const { ApolloError } = require("apollo-server-errors");

function nWithCommas(x) {
  if (!x) return 0;
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function amountFormat(amount) {
  if (!amount) return 0;
  const floatAmount = parseFloat(amount).toFixed(2);
  return nWithCommas(floatAmount);
}

const formatCompanyName = (companyName) => {
  if (companyName.includes("Fund")) return companyName;
  const splitCompanyArray = companyName.split(" ");

  if (splitCompanyArray[splitCompanyArray.length - 1] !== "SPV") {
    return [...splitCompanyArray, "SPV"].join(" ");
  }

  return companyName;
};

function throwApolloError(err, resolverName) {
  const errorLogger = appLogger("allocations-graphql-api", {
    name: resolverName,
    shouldSendLogs,
  });

  // log error to console & send to logDNA if in production
  errorLogger(err);

  if (err.error?.includes("{") || err.message?.includes("{")) {
    throw new ApolloError("External error");
  }
  throw new ApolloError(err.error || err.message, err.status, err);
}

module.exports = {
  nWithCommas,
  amountFormat,
  formatCompanyName,
  throwApolloError,
};
