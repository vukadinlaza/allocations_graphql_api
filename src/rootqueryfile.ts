import { GraphQLObjectType, GraphQLString } from "graphql";
import { IInvestorType } from "./types/IInvestor";

export const RootQueryType = new GraphQLObjectType({
    name: 'RootQueryType',
    fields: {
        investor: {
            type: IInvestorType,
            resolve() {
                const data = {
                    investor_id: "123123", 
                    investor_name: "Tanver",
                    investor_residence: "USA",
                }
                return data;
            }
        }
    }
});
