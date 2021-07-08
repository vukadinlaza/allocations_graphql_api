// import ENVs from .env (gitignored)
require('dotenv').config();

// const { ApolloServer, gql } = require('apollo-server-express')
const bodyParser = require('body-parser')
const compression = require('compression')
const cors = require('cors')
const express = require('express')
const { execute, subscribe } = require('graphql')
const helmet = require('helmet')
const xmlparser = require('express-xml-bodyparser');
const { WebClient, LogLevel } = require('@slack/web-api');
const { authedServer } = require('./graphql/server')
const { connect } = require('./mongo')
const { createEventAdapter } = require('@slack/events-api')
const getSettings = require('./settings');
const { last, mapValues, omit, keyBy } = require('lodash');
const http = require('http');
const slackEvents = createEventAdapter(process.env.SLACK_SIGNING_SECRET, {
  includeBody: true,
  includeHeaders: true
});
const slack = new WebClient(process.env.SLACK_CLIENT_TOKEN, {
  logLevel: LogLevel.DEBUG,

});
const { NODE_ENV } = process.env


/**

  Boilerplate express server that attaches apollo

 **/

function corsWhitelist(whitelist) {
  const origin = (origin, cb) => {
    if (origin && origin.includes('vercel.app')) {
      return cb(null, true)
    }
    if (whitelist.includes(origin) || !origin) {
      cb(null, true)
    } else {
      cb(new Error('Not allowed by CORS'))
    }
  }
  return cors({ origin })
}

async function run() {
  const app = express()
  const port = process.env.PORT || 4000
  const settings = await getSettings(NODE_ENV)
  const httpServer = http.createServer(app);

  // only prevent CORS if in production
  if (NODE_ENV === "production" || NODE_ENV === "staging") {
    app.use("*", corsWhitelist(settings.default.cors))
  }

  // standard express middlewares
  app.use('/api/webhooks/slack', slackEvents.requestListener())
  app.use(helmet())
  app.use(compression())
  app.use(xmlparser());
  const rawBodyBuffer = (req, res, buf, encoding) => {
    if (buf && buf.length) {
      req.rawBody = buf.toString(encoding || 'utf8');
    }
  };

  app.use(bodyParser.urlencoded({ verify: rawBodyBuffer, extended: true }));
  app.use(bodyParser.json({ verify: rawBodyBuffer }));


  //slack API
  app.use('/api/webhooks', require('./express/webhooks/index'))
  app.use('/api/users', require('./express/api/user'))
  app.use('/api/deal', require('./express/api/deal'))


  // connect to MongoDB
  const db = await connect()


  // auth handling (only prod for now)
  console.log("⛰️ Environment: ", process.env.NODE_ENV)

  app.use((err, req, res, next) => {
    if (err.name === "UnauthorizedError") {
      console.log(err);
      res.status(401).send("invalid token");
    } else {
      console.log("Uncaught Error")
      console.log(err);
      next(err);
    }
  });

  // init auth graphql server
  const authedGraphqlServer = authedServer(db)
  authedGraphqlServer.applyMiddleware({ app })
  authedGraphqlServer.installSubscriptionHandlers(httpServer);


  httpServer.listen({ port }, () =>
    console.log(`🚀 Server ready at http://localhost:4000${authedGraphqlServer.graphqlPath}`)
  );
}

process.on('unhandledRejection', error => {
  // Will print "unhandledRejection err is not defined"
  console.log('unhandledRejection', error);
  throw new Error(error)
});

run().then()
