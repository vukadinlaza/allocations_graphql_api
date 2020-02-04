// import ENVs from .env (gitignored)
require('dotenv').config();

const bodyParser = require('body-parser')
const compression = require('compression')
const cors = require('cors')
const express = require('express')
const { execute, subscribe } = require('graphql')
const helmet = require('helmet')
const initGraphQlServer = require('./graphql/server')
const authenticate = require('./auth')
const { connect } = require('./mongo')
const { ApolloServer, gql } = require('apollo-server-express');

const { NODE_ENV } = process.env

async function run () {
  const app = express();
  const port = process.env.PORT || 4000;


  // only prevent CORS if in production
  if (NODE_ENV === "production") {
    app.use("*", cors({ origin: `https://dashboard.allocations.co` }));
  }

  if (NODE_ENV === "staging") {
    app.use("*", cors({ origin: `https://staging.allocations.co` }));
  }

  // standard express middlewares
  app.use(helmet());
  app.use(compression());
  app.use(bodyParser.urlencoded({extended: true}));
  app.use(bodyParser.json());

  // connect to MongoDB
  const db = await connect()

  // init graphql server
  const graphqlServer = initGraphQlServer(db)

  // auth handling (only prod for now)
  console.log("⛰️ Environment: ", process.env.NODE_ENV)
  const credential = process.env.NODE_ENV === "production"

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
  
  graphqlServer.applyMiddleware({ app });

  app.listen({ port }, () =>
    console.log(`🚀 Server ready at http://localhost:4000${graphqlServer.graphqlPath}`)
  );
}

process.on('unhandledRejection', error => {
  // Will print "unhandledRejection err is not defined"
  console.log('unhandledRejection', error);
  throw new Error(error)
});

run().then()