import bodyParser from "body-parser";
import compression from "compression";
import cors from "cors";
import * as dotenv from "dotenv";
import express from "express";
import { execute, subscribe } from "graphql";
import helmet from "helmet";
import { createServer } from "http";
import initGraphqlServer from "./graphql/server"
import auth from "./auth"
import { connect } from './mongo'

// import ENVs from .env (gitignored)
dotenv.config();

async function run () {
  const app = express();
  const PORT = process.env.PORT || 4000;

  // // only prevent CORS if in production
  // if (process.env.NODE_ENV === "production") {
  //   app.use("*", cors({ origin: `https://admin.allocations.co` }));
  // }

  // standard express middlewares
  app.use(helmet());
  app.use(compression());
  app.use(bodyParser.urlencoded({extended: true}));
  app.use(bodyParser.json());

  // connect to MongoDB
  const db = await connect()

  // init graphql server
  const graphqlServer = initGraphqlServer(db)

  // auth handling (only prod for now)
  console.log("⛰️ Environment: ", process.env.NODE_ENV)
  const credential = process.env.NODE_ENV === "production"
  // if (process.env.NODE_ENV === "production") {
  // app.use(auth);
  // }

  app.use((err: any, req: any, res: any, next: any) => {
    if (err.name === "UnauthorizedError") {
      console.log(err);
      res.status(401).send("invalid token");
    } else {
      console.log("Uncaught Error")
      console.log(err);
      next(err);
    }
  });

  // start HTTP server
  const httpServer = createServer(app);
  
  graphqlServer.applyMiddleware({ app });
  graphqlServer.installSubscriptionHandlers(httpServer);

  httpServer.listen(PORT, () => {
    console.log(
      `🚀 Server ready at http://localhost:${PORT}${graphqlServer.graphqlPath}`
    );
    console.log(
      `🚀 Subscriptions ready at ws://localhost:${PORT}${graphqlServer.subscriptionsPath}`
    );
  });
}

process.on('unhandledRejection', error => {
  // Will print "unhandledRejection err is not defined"
  console.log('unhandledRejection', error);
});

run().then(() => console.log(`Server Successfully Started`))