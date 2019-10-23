import { ApolloServer } from "apollo-server-express";
import responseCachePlugin from "apollo-server-plugin-response-cache";
import bodyParser from "body-parser";
import compression from "compression";
import cors from "cors";
import * as dotenv from "dotenv";
import express from "express";
import jwt from "express-jwt";
import helmet from "helmet";
import { createServer } from "http";
import jwksRsa from "jwks-rsa";
import jwksClient from "jwks-rsa";
import { Db } from "mongodb";
import { IContextType } from "./IContextType";
import { MongoConnnection } from "./mongo/Connector";
import { Schema } from "./schema";
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
app.use(cors());
app.use(helmet());
app.use(compression());
app.use(bodyParser.urlencoded({
  extended: true,
}));
app.use(bodyParser.json());

// tslint:disable-next-line:variable-name
const mongodb_username = process.env.MONGO_USERNAME || " ";
const password = process.env.MONGO_PASSWORD || " ";


// tslint:disable-next-line:max-line-length
const connectionUrl = `mongodb+srv://${mongodb_username}:${password}@allocations-3plbs.gcp.mongodb.net/test?retryWrites=true&w=majority`;


const mongoDbCon = new MongoConnnection(connectionUrl);
const mdb = mongoDbCon.getDb().then((db: Db) => db).catch((err) => console.log(err));

let credential = false;
console.log(process.env.NODE_ENV)
if (process.env.NODE_ENV === "production") {
  credential = true
} else {
  credential = false
}

const auth = jwt({
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `https://allocations1.auth0.com/.well-known/jwks.json`
  }),

  audience: "https://api.graphql.com",
  issuer: `https://allocations1.auth0.com/`,
  algorithms: ["RS256"],
  credentialsRequired: false,
});


const getDb = mdb;
const server = new ApolloServer({

  schema: Schema,

  subscriptions: { path: "/websocket" },
  context: ({ req }) => {
    const token = req.headers.authorization || '';

    return { getDb, token };
  },
  cacheControl: {
    defaultMaxAge: 5,
  },
  introspection: true,
  plugins: [responseCachePlugin()],
});
if (process.env.NODE_ENV !== "development") {
  app.use(auth);
}

app.use((err: any, req: any, res: any, next: any) => {
  if (err.name === "UnauthorizedError") {
    console.log(err);
    res.status(401).send("invalid token");
  } else {
    next(err);
  }
});
const httpserver = createServer(app);
server.applyMiddleware({ app });

httpserver.listen(PORT, () => {
  console.log(
    `🚀 Server ready at http://localhost:${PORT}${server.graphqlPath}`
  );
  console.log(
    `🚀 Subscriptions ready at ws://localhost:${PORT}${server.subscriptionsPath}`
  );
});