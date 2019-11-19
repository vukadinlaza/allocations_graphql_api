import { ApolloServer } from "apollo-server-express";
import responseCachePlugin from "apollo-server-plugin-response-cache";
import bodyParser from "body-parser";
import compression from "compression";
import cors from "cors";
import * as dotenv from "dotenv";
import express from "express";
import jwt from "express-jwt";
import { execute, subscribe } from "graphql";
import helmet from "helmet";
import { createServer } from "http";
import jwksRsa from "jwks-rsa";
import jwksClient from "jwks-rsa";
import { Db } from "mongodb";
import { SubscriptionServer } from "subscriptions-transport-ws";
import { IContextType } from "./graphql/IContextType";
import { Schema } from "./graphql/schema";

import { connect } from './mongo'
dotenv.config();

async function run () {
  const app = express();
  const PORT = process.env.PORT || 4000;

  if (process.env.NODE_ENV === "production") {
    app.use("*", cors({ origin: `https://admin.allocations.co` }));
  }

  app.use(helmet());
  app.use(compression());
  app.use(bodyParser.urlencoded({extended: true}));
  app.use(bodyParser.json());

  const db = await connect() 

  let credential = false;
  if (process.env.NODE_ENV === "production") {
    credential = true;
  } else {
    credential = false;
  }

  const auth = jwt({
    secret: jwksRsa.expressJwtSecret({
      cache: true,
      rateLimit: true,
      jwksRequestsPerMinute: 5,
      jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`
    }),

    audience: "https://api.graphql.com",
    issuer: `https://${process.env.AUTH0_DOMAIN}/`,
    algorithms: ["RS256"],
    credentialsRequired: false,
  });

  const server = new ApolloServer({
    schema: Schema,
    context: async ({ req, connection }) => {
      if (connection) {
        return { ...connection.context };
      } else {
        const token = req.headers.authorization || "";
        // console.log(token);
        return { db, token };
      }

    },
    subscriptions: {
      path: "/subscriptions",
      onConnect: async (connectionParams, webSocket, context) => {
        console.log(`Subscription client connected using Apollo server's built-in SubscriptionServer.`)
      },
      onDisconnect: async (webSocket, context) => {
        console.log(`Subscription client disconnected.`);
      },
    },
    cacheControl: {
      defaultMaxAge: 5,
    },
    introspection: true,
    plugins: [responseCachePlugin()],
  });

  console.log("⛰️ Environment: ", process.env.NODE_ENV)
  if (process.env.NODE_ENV === "production") {
    app.use(auth);
  }

  app.use((err: any, req: any, res: any, next: any) => {
    if (err.name === "UnauthorizedError") {
      console.log(err);
      res.status(401).send("invalid token");
    } else {
      console.log(err);
      next(err);
    }
  });
  server.applyMiddleware({ app });
  const httpServer = createServer(app);

  server.installSubscriptionHandlers(httpServer);

  httpServer.listen(PORT, () => {
    console.log(
      `🚀 Server ready at http://localhost:${PORT}${server.graphqlPath}`
    );
    console.log(
      `🚀 Subscriptions ready at ws://localhost:${PORT}${server.subscriptionsPath}`
    );
  });
}

run().then(() => console.log(`Server Successfully Started`))