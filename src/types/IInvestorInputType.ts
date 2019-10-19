
import { GraphQLInputObjectType, GraphQLInt, GraphQLList, GraphQLString } from "graphql";


export const IInvestorInputType = new GraphQLInputObjectType({
    name: "IInvestorInputType",
    fields: {
        first_name: { type: GraphQLString },
        last_name: { type: GraphQLString },
        email: { type: GraphQLString },
        residence: { type: GraphQLString },
        accredited_type: { type: GraphQLString },
        accredidted_status: { type: GraphQLString },
        entity_name: { type: GraphQLString },
        investor_type: { type: GraphQLString },
        passport: { type: GraphQLString },
        deal_complete_data: { type: GraphQLString },
        total_invested: { type: GraphQLInt },
        deals_invited: { type: GraphQLList(GraphQLString) },
        kyc_status: { type: GraphQLString },
        aml_status: { type: GraphQLString },
        score: { type: GraphQLInt },
    },
});
