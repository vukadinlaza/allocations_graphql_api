const { ApolloServer, PubSub } = require("apollo-server-express");
const { authenticate } = require("../auth");
const logger = require("../utils/logger");
const { typeDefs, resolvers } = require("../graphql/resolvers");
const Deals = require("./datasources/Deals");
const ReferenceNumber = require("./datasources/NDReferenceNumber");
const pubsub = new PubSub();

function authedServer(db) {
  const publicEndpoints = ["PublicDeal"];

  return new ApolloServer({
    typeDefs,
    resolvers,
    uploads: false,
    context: async (payload) => {
      const datasources = {
        deals: new Deals(db.collection("deals")),
        referenceNumber: new ReferenceNumber(
          db.collection("reference_numbers")
        ),
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
  });
}
module.exports = { authedServer, pubsub };
