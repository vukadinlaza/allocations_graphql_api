import { GraphQLSchema } from "graphql";
import { RootMutationType } from './RootMutationType';
import { RootQueryType } from "./RootQueryType";

export const Schema = new GraphQLSchema({
    query: RootQueryType,
    mutation: RootMutationType,
   // subscription: RootSubscriptionType
  });
