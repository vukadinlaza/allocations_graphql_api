import { GraphQLSchema } from "graphql";
import { RootMutationType } from "./RootMutationType";
import { RootQueryType } from "./RootQueryType";
import { RootSubscriptionType } from "./RootSubscriptionType";

export const Schema = new GraphQLSchema({
    query: RootQueryType,
    mutation: RootMutationType,
    subscription: RootSubscriptionType
});
