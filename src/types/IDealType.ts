import { GraphQLID, GraphQLInt, GraphQLList, GraphQLObjectType, GraphQLString, GraphQLBoolean } from "graphql";

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
        company_name: { type: GraphQLString },
        company_description: { type: GraphQLString },
        investment_documents: { type: GraphQLString },
        date_closed: { type: GraphQLString },
        closed: { type: GraphQLBoolean },
        amount: { type: GraphQLInt }
    },
});
export const IDealDeleteType = new GraphQLObjectType({
    name: "IDealDeleteType",
    fields: {
        _id: { type: GraphQLID },
    },
});

