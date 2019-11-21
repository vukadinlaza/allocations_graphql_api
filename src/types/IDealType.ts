import { GraphQLID, GraphQLInt, GraphQLList, GraphQLObjectType, GraphQLString } from "graphql";

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
        entity_name: { type: GraphQLString },
        deal_name: { type: GraphQLString },
        amount_wired: { type: GraphQLInt },
        amount: { type: GraphQLString },
        name: { type: GraphQLString },
        user_id: { type: GraphQLString },
        total_investors: { type: GraphQLInt },
        deal_complete_date: { type: GraphQLString },
        operations_agreement: { type: GraphQLString },
        subscription_agreement: { type: GraphQLString },
        private_placement_memorandum: { type: GraphQLString },
        createdAt: { type: GraphQLString },
        updatedAt: { type: GraphQLString },
        investors: { type: new GraphQLList(IdealInvestorType) },
        bank_account: { type: GraphQLString},
        formation_certificate_filing: { type: GraphQLString},
        ein_filing: { type: GraphQLString},
        form_d_filing: { type: GraphQLString},
        form_1065_filing: {type: GraphQLString},
        w9_filing: {type: GraphQLString},
    },
});
export const IDealDeleteType = new GraphQLObjectType({
    name: "IDealDeleteType",
    fields: {
        _id: { type: GraphQLID },
    },
});

