const { connect, drop, endDBConnection } = require("../src/mongo");
const { authedServer } = require("../src/graphql/server");
const { seed } = require("./seed");

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
    beforeAll(async () => (db = await connect(global.__MONGO_URI__)));
    beforeAll(() => (server = authedServer(db)));
    beforeEach(() => drop(db));
    beforeEach(() => seed(db));
    afterAll(() => endDBConnection());

    contextFn(context);
  });
};

module.exports = { describeWithServer };
