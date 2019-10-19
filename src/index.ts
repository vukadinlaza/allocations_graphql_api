import { ApolloServer } from "apollo-server-express";
import cors from "cors";
import * as dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import { createServer } from "http";
import { Db } from "mongodb";
import { MongoConnnection } from "./mongo/Connector";
import { Schema } from "./schema";
import { IContextType } from "./IContextType";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
app.use(cors());
// tslint:disable-next-line:variable-name
const mongodb_username = process.env.MONGO_USERNAME || "api_server";
const password = process.env.MONGO_PASSWORD || "DBPIsG1n2aVlCHRL";

const httpserver = createServer(app);
app.use(helmet());
// Auth0 Middleware ( Check user is authenticated)

// tslint:disable-next-line:max-line-length
const connectionUrl = `mongodb+srv://${mongodb_username}:${password}@allocations-3plbs.gcp.mongodb.net/test?retryWrites=true&w=majority`;
console.log(connectionUrl);
const mongoDbCon = new MongoConnnection(connectionUrl);
const mdb = mongoDbCon.getDb().then((db: Db) => db).catch((err) => console.log(err));

const contextObject: IContextType = {
  getDb: mdb,
};

const server = new ApolloServer({
  schema: Schema,
  subscriptions: { path: "/websocket" },
  context: contextObject,
  cacheControl: {
    defaultMaxAge: 5,
  },
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