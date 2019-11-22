import { ApolloServer } from "apollo-server-express";
import { Schema } from "./schema";
import { Db } from "mongodb";
import responseCachePlugin from "apollo-server-plugin-response-cache";
import { Request } from "express"
import auth0 from 'auth0'

const auth0Client = new auth0.AuthenticationClient({
  domain: "login.allocations.co",
  clientId: "" 
})

export interface IRequest extends Request {
  user: any // or any other type
}

async function getUserFromToken (token: string, db: Db) {
  try {
    const { email } = await auth0Client.getProfile(token.slice(7))
    return db.collection("users").findOne({ email })
  } catch (e) {
    return null
  }
}

export default function server(db: Db) {
    return new ApolloServer({
        schema: Schema,
        context: async ({ req, connection }: { req: IRequest, connection: any }) => {
          if (connection) {
            return { ...connection.context };
          } else {
            const token = req.headers.authorization || "";
            // get profile info via auth0
            const user = await getUserFromToken(token, db)
            return { db, token, user };
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