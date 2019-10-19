import { GraphQLInt, GraphQLList, GraphQLObjectType, GraphQLString, graphqlSync } from "graphql";

const IdealInvestorType = new GraphQLObjectType({
    name: "IdealInvestorType",
    fields: {
        _id: { type: GraphQLString },
    },
});
export const IDealType = new GraphQLObjectType({
    name: "IDealType",
    fields: {
        _id: { type: GraphQLString },
        entity_name: { type: GraphQLString },
        deal_name: { type: GraphQLString },
        amount_wired: { type: GraphQLInt },
        total_investors: { type: GraphQLInt },
        deal_complete_date: { type: GraphQLString },
        investors: { type: new GraphQLList(IdealInvestorType) },
    },
});
