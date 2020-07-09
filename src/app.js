// import ENVs from .env (gitignored)
require('dotenv').config();

// const { ApolloServer, gql } = require('apollo-server-express')
const bodyParser = require('body-parser')
const compression = require('compression')
const cors = require('cors')
const express = require('express')
const { execute, subscribe } = require('graphql')
const helmet = require('helmet')

const { authedServer } = require('./graphql/server')
const { connect } = require('./mongo')
const getSettings = require('./settings')

const { NODE_ENV } = process.env

/** 

  Boilerplate express server that attaches apollo

 **/

function corsWhitelist (whitelist) {
  const origin = (origin, cb) => {
    if (whitelist.includes(origin)) {
      cb(null, true)
    } else {
      cb(new Error('Not allowed by CORS'))
    }
  }
  return cors({ origin })
}

async function run () {
  const app = express()
  const port = process.env.PORT || 4000
  const settings = await getSettings(NODE_ENV)

  // only prevent CORS if in production
    console.log(settings.default.cors)
  if (NODE_ENV === "production" || NODE_ENV === "staging") {
    app.use("*", corsWhitelist(settings.default.cors))
  }

  // standard express middlewares
  app.use(helmet())
  app.use(compression())
  app.use(bodyParser.urlencoded({extended: true}))
  app.use(bodyParser.json())

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

  app.use('/api/webhooks', require('./express/webhooks/index'))

  
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
