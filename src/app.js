/* eslint-disable no-console */

// Datadog tracing
require("dd-trace").init({});

const getSettings = require("./settings");
const compression = require("compression");
const cors = require("cors");
const express = require("express");
const helmet = require("helmet");
const xmlparser = require("express-xml-bodyparser");
const { authedServer } = require("./graphql/server");
const { getDB, endDBConnection } = require("./mongo");
const { graphqlUploadExpress } = require("graphql-upload");
const http = require("http");
const { errorMiddleware } = require("@allocations/api-common");
const { NODE_ENV } = process.env;

/**

  Boilerplate express server that attaches apollo

 **/

function corsWhitelist(whitelist) {
  const origin = (origin, cb) => {
    if (origin && origin.includes("vercel.app")) {
      return cb(null, true);
    }
    if (whitelist.includes(origin) || !origin) {
      cb(null, true);
    } else {
      cb(new Error("Not allowed by CORS"));
    }
  };
  return cors({ origin });
}

async function run() {
  const settings = await getSettings(NODE_ENV);
  const app = express();
  const port = process.env.PORT || 4000;
  const httpServer = http.createServer(app);

  // only prevent CORS if in production
  if (NODE_ENV === "production" || NODE_ENV === "staging") {
    app.use("*", corsWhitelist(settings.default.cors));
  }

  // standard express middlewares
  app.use(helmet());
  app.use(compression());
  app.use(xmlparser());
  const rawBodyBuffer = (req, res, buf, encoding) => {
    if (buf && buf.length) {
      req.rawBody = buf.toString(encoding || "utf8");
    }
  };

  app.use(express.urlencoded({ verify: rawBodyBuffer, extended: true }));
  app.use(express.json({ verify: rawBodyBuffer }));
  app.use(graphqlUploadExpress({ maxFileSize: 1000000000, maxFiles: 10 }));
  app.use(cors());
  app.use("/health", require("./express/api/health"));
  app.use("/api/webhooks", require("./express/webhooks/index"));
  app.use("/api/users", require("./express/api/user"));
  app.use("/api/deal", require("./express/api/deal"));
  app.use("/api/stripe", require("./express/api/stripe"));
  app.use(errorMiddleware());

  // connect to MongoDB
  const db = await getDB();

  // auth handling (only prod for now)
  console.log("⛰️ Environment: ", process.env.NODE_ENV);

  app.use((err, req, res, next) => {
    if (err.name === "UnauthorizedError") {
      console.log("UnauthorizedError :>>", err);
      res.status(401).send("invalid token");
    } else {
      console.log("Uncaught Error :>> ", err);
      next(err);
    }
  });

  // init auth graphql server
  const authedGraphqlServer = authedServer(db);
  authedGraphqlServer.applyMiddleware({ app });
  authedGraphqlServer.installSubscriptionHandlers(httpServer);

  httpServer.listen({ port }, () =>
    console.log(
      `🚀 Server ready at http://localhost:4000${authedGraphqlServer.graphqlPath}`
    )
  );
}

process.on("unhandledRejection", (error) => {
  // Will print "unhandledRejection err is not defined"
  console.log("unhandledRejection :>>", error);
});
process.on("SIGTERM", endDBConnection);

module.exports = run;
