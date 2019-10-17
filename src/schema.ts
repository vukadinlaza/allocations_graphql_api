import { GraphQLSchema } from "graphql";
import { RootQueryType } from "./rootqueryfile";

export const Schema = new GraphQLSchema({
    query: RootQueryType,
    // mutation: RootMutationType,
   // subscription: RootSubscriptionType
  });