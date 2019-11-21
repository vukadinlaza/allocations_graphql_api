import { ApolloServer } from "apollo-server-express";
import { Schema } from "./schema";
import { Db } from "mongodb";
import responseCachePlugin from "apollo-server-plugin-response-cache";
import { Request } from "express"

export interface IRequest extends Request {
  user: any // or any other type
}

export default function server(db: Db) {
    return new ApolloServer({
        schema: Schema,
        context: async ({ req, connection }: { req: IRequest, connection: any }) => {
          if (connection) {
            return { ...connection.context };
          } else {
            const token = req.headers.authorization || "";
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
}