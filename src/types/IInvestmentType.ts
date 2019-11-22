import { GraphQLInt, GraphQLList, GraphQLObjectType, GraphQLString, GraphQLFloat, GraphQLID } from "graphql";
import { IDealType } from './IDealType'
import { IUserType } from './IUserType'

export const IInvestmentType:GraphQLObjectType = new GraphQLObjectType({
  name: "IInvestmentType",
  fields: {
    _id: { type: GraphQLString },
    amount: { type: GraphQLInt },
    deal: { type: IDealType },
    user: { type: IUserType },
    documents: { type: GraphQLString }
  }
});

export const IInvestmentTypeWoUser:GraphQLObjectType = new GraphQLObjectType({
  name: "IInvestmentTypeWoUser",
  fields: {
    _id: { type: GraphQLString },
    amount: { type: GraphQLInt },
    deal: { type: IDealType },
    documents: { type: GraphQLString }
  }
});
