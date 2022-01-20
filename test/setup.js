const { connect, drop, endDBConnection } = require("../src/mongo");
const { authedServer } = require("../src/graphql/server");
const { seed } = require("./seed");
const { logger } = require("../src/utils/logger");

jest.mock("jsonwebtoken", () => ({
  verify: (token, __, ___, cb) =>
    cb(null, {
      [`${process.env.AUTH0_NAMESPACE}/email`]: `${token}@allocations.com`,
    }),
}));
jest.mock("../src/utils/docusign.js", () => ({}));
jest.mock("aws-sdk/clients/s3", () => {
  return class S3 {
    upload() {
      return { promise: () => {} };
    }
  };
});
jest.mock("../src/cloudfront.js");

const describeWithServer = (name, contextFn) => {
  let db;
  let server;

  const context = {
    execute(query, userType) {
      return server.executeOperation(query, {
        req: {
          headers: {
            authorization: `Bearer ${userType}`,
            origin: "",
          },
        },
      });
    },
    executeOperationAsAdmin(query) {
      return context.execute(query, "superAdmin");
    },
    executeOperationAsFundAdmin(query) {
      return context.execute(query, "fundAdmin");
    },
    executeOperationAsInvestor(query) {
      return context.execute(query, "investor");
    },
    executeOperationAsLoggedIn(query) {
      return context.execute(query, "altInvestor");
    },
    executeOperation(query) {
      return server.executeOperation(query);
    },
  };

  describe(name, () => {
    beforeAll(
      async () =>
        (db = await connect({
          url: global.__MONGO_URI__,
          dbName: process.env.JEST_WORKER_ID,
        }))
    );
    beforeAll(() => (server = authedServer(db)));
    beforeEach(() => drop(db));
    beforeEach(() => seed(db));
    afterAll(() => endDBConnection());

    contextFn(context);
  });
};

const testError = (name, testFn) => {
  test(name, async () => {
    const loggerError = logger.error;
    logger.error = () => {};
    await testFn();
    logger.error = loggerError;
  });
};

module.exports = { describeWithServer, testError };
