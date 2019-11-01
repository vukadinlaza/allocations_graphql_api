import { GraphQLInputObjectType, GraphQLInt, GraphQLList, GraphQLString } from "graphql";

export const IDealInvestorInputType = new GraphQLInputObjectType({
    name: "IDealInvestorInputType",
    fields: {
        _id: { type: GraphQLString },
    },
});

export const IDealInputType = new GraphQLInputObjectType({
    name: "IDealInputType",
    fields: {
        entity_name: { type: GraphQLString },
        deal_name: { type: GraphQLString },
        amount_wired: { type: GraphQLInt },
        total_investors: { type: GraphQLInt },
        deal_complete_date: { type: GraphQLString },
        operations_agreement: { type: GraphQLString },
        subscription_agreement: { type: GraphQLString },
        private_placement_memorandum: { type: GraphQLString },
        investors: { type: new GraphQLList(IDealInvestorInputType) },
    },
});
