import express from 'express'
import { createServer } from 'http';

import { ApolloServer } from "apollo-server-express";
import { Schema } from './schema';

const app = express();
const PORT = 4000;

const httpserver = createServer(app);

const server = new ApolloServer({
    schema: Schema,
    subscriptions: { path: "/websocket" },
    cacheControl: {
      defaultMaxAge: 5,
    }
  });
  
  server.applyMiddleware({ app });

httpserver.listen(PORT, () => {
    console.log(
      `🚀 Server ready at http://localhost:${PORT}${server.graphqlPath}`
    );
    console.log(
      `🚀 Subscriptions ready at ws://localhost:${PORT}${server.subscriptionsPath}`
    );
  });