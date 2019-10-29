import { GraphQLObjectType, GraphQLInt } from "graphql";
import { PubSub } from "graphql-subscriptions";

export const pubsub = new PubSub();

export const RootSubscriptionType = new GraphQLObjectType({
    name: "RootSubscriptionType",
    fields: {
        dealDeleted: {
            type: GraphQLInt,
            subscribe: () => {
                pubsub.asyncIterator("user deleted");
            },
        },
    }
})