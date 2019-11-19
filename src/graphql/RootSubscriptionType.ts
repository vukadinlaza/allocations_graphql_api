import { GraphQLObjectType, GraphQLInt, GraphQLString } from "graphql";
import { PubSub } from "graphql-subscriptions";
import { IDealType } from '../types/IDealType';

export const pubsub = new PubSub();

export const DEAL_DELETED = "USER DELETED";
export const DEAL_ADDED = "DEAL ADDED";
export const RootSubscriptionType = new GraphQLObjectType({
    name: "RootSubscriptionType",
    fields: {
        DealDeleted: {
            type: GraphQLString,
            subscribe: () => {
                pubsub.asyncIterator([DEAL_DELETED]);
            },
        },
        DealAdded: {
            type: IDealType,
            subscribe: () => pubsub.asyncIterator([DEAL_ADDED])
        },
    },
});
