import { GraphQLObjectType, GraphQLString, GraphQLBoolean, GraphQLList } from "graphql";
import { IInvestmentTypeWoUser } from './IInvestmentType'

export const IUserType:GraphQLObjectType = new GraphQLObjectType({
  name: "IUserType",
  fields: {
    _id: { type: GraphQLString },
    first_name: { type: GraphQLString },
    last_name: { type: GraphQLString },
    email: { type: GraphQLString },
    admin: { type: GraphQLBoolean },
    investments: { type: new GraphQLList(IInvestmentTypeWoUser) }
  },
});