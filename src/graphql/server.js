const { logger } = require("@allocations/api-common");
const { ApolloServer, PubSub } = require("apollo-server-express");
const { authenticate } = require("../auth");
const { typeDefs, resolvers } = require("../graphql/resolvers");
const Deals = require("./datasources/Deals");
const Investments = require("./datasources/Investments");
const pubsub = new PubSub();

function authedServer(db) {
  const publicEndpoints = ["PublicDeal", "Search_Auth_users", "reset_password"];

  return new ApolloServer({
    introspection: true,
    typeDefs,
    resolvers,
    uploads: false,
    context: async (payload) => {
      const datasources = {
        deals: new Deals(db.collection("deals")),
        investments: new Investments(db.collection("investments")),
      };

      // public deal endpoint skips authentication

      if (
        payload.req &&
        payload.req.body &&
        publicEndpoints.includes(payload.req.body.operationName)
      ) {
        return { db, datasources };
      }
      const authToken =
        payload &&
        payload.connection &&
        payload.connection.context &&
        payload.connection.context.authToken;
      const user = await authenticate({ req: payload.req, db, authToken });

      //Log for Datadog
      const {
        operationName = "N/A",
        variables = {},
        query = "",
      } = payload?.req?.body;
      if (operationName && operationName !== "IntrospectionQuery")
        logger.info({
          user: user.email,
          user_id: user._id,
          operationName,
          type: query.match(/[a-z]+\b/)?.[0] || "N/A",
          variables: JSON.stringify(variables),
        });

      return { user, db, pubsub, datasources };
    },
    plugins: [
      {
        requestDidStart: () => {
          return {
            didEncounterErrors: ({ context, operationName, errors }) => {
              logger.error(errors[0]);
              logger.error({ user: context.user || {}, operationName });
            },
          };
        },
      },
    ],
    formatError: (err) => {
      return { message: err.message, status: err.extensions.status };
    },
  });
}
module.exports = { authedServer, pubsub };
