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
const { WebClient } = require('@slack/client');
const { authedServer } = require('./graphql/server')
const { connect } = require('./mongo')
const { createEventAdapter } = require('@slack/events-api')
const getSettings = require('./settings')
const slackEvents = createEventAdapter(process.env.SLACK_SIGNING_SECRET, {
  includeBody: true,
  includeHeaders: true
});
const slack = new WebClient(process.env.SLACK_CLIENT_TOKEN);
const { NODE_ENV } = process.env


/** 

  Boilerplate express server that attaches apollo

 **/

function corsWhitelist(whitelist) {
  const origin = (origin, cb) => {
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

  // only prevent CORS if in production
  if (NODE_ENV === "production" || NODE_ENV === "staging") {
    app.use("*", corsWhitelist(settings.default.cors))
  }

  // standard express middlewares
  app.use(helmet())
  app.use(compression())
  app.use(bodyParser.urlencoded({ extended: true }))
  app.use(bodyParser.json())
  app.use(xmlparser());

  //slack API
  app.use('/api/webhooks/slack', slackEvents.expressMiddleware())
  app.use('/api/webhooks', require('./express/webhooks/index'))



  const messageAttachmentFromLink = () => {

  }

  slackEvents.on('link_shared', (event) => {
    console.log(event)
    console.log(`LINK POSTED`);
    // Promise.all(event.links.map(messageAttachmentFromLink))
    //   // Transform the array of attachments to an unfurls object keyed by URL
    //   .then(attachments => keyBy(attachments, 'url'))
    //   .then(unfurls => mapValues(unfurls, attachment => omit(attachment, 'url')))
    //   // Invoke the Slack Web API to append the attachment
    //   .then(unfurls => slack.chat.unfurl(event.message_ts, event.channel, unfurls))
    //   .catch(console.error);
  });

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

  app.listen({ port }, () =>
    console.log(`🚀 Server ready at http://localhost:4000${authedGraphqlServer.graphqlPath}`)
  );
}

process.on('unhandledRejection', error => {
  // Will print "unhandledRejection err is not defined"
  console.log('unhandledRejection', error);
  throw new Error(error)
});

run().then()
