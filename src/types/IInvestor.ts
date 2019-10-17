import { GraphQLInt, GraphQLObjectType, GraphQLString } from "graphql";

export const IInvestorType = new GraphQLObjectType({
  name: "IInvestorType",
  fields: {
    investor_id: { type: GraphQLString },
    investor_name: { type: GraphQLString },
    investor_residence: { type: GraphQLString },
  }
});