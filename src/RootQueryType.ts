import { GraphQLList, GraphQLNonNull, GraphQLObjectType, GraphQLString } from "graphql";
import { IDeal } from "./models/Deal";
import { IInvestor } from "./models/Investor";
import { IDealType } from "./types/IDealType";
import { IInvestorType } from "./types/IInvestorType";
import { getAllDeals } from "./mongo/queries/getAllDeals";

const deal_data: IDeal[] = [
    {
        _id: "123",
        entity_name: "AS Bruch",
        deal_name: "Bakkt",
        amount_wired: 564226,
        deal_complete_date: Date.now().toString(),
        total_investors: 6,
        investors: [],
    },
];

const investor_data: IInvestor[] = [
    {
        _id: "12345",
        first_name: "tanver",
        last_name: "hasan",
        email: "t.h.noman@outlook.com",
        residence: "ss",
        accredited_type: "sss",
        accredidted_status: "ssss",
        entity_name: "adf",
        investor_type: "ss",
        passport: "laksjdf",
        deal_complete_data: Date.now.toString(),
        total_invested: 88888,
        deals_invited: ["sdf", "ksdljf"],
        kyc_status: "sdf",
        aml_status: "lkasjdf",
        score: 44,

    },
];


export const RootQueryType = new GraphQLObjectType({
    name: "RootQueryType",
    fields: {
        GetDeals: {
            type: new GraphQLList(IDealType),
            resolve(obj, args, ctx) {
                return ctx.db.then((db: any) => {
                    return getAllDeals(db).then(data => {
                        console.log(data);
                        return data;
                    });
                });
                // Parse data from database
                // return deal_data;
            },
        },
        GetDealById: {
            type: IDealType,
            args: {
                id: { type: new GraphQLNonNull(GraphQLString) },
            },
            resolve(obj, args, ctx) {
                const data = deal_data.find((deal) => {
                    return deal._id === args.id;
                });

                // Seach collections and find documents based on condition
                return data;
            },
        },
        GetInvestors: {
            type: new GraphQLList(IInvestorType),
            resolve() {

                return investor_data;
            },
        },
        GetInvestorById: {
            type: IInvestorType,
            args: {
                id: { type: new GraphQLNonNull(GraphQLString) },
            },
            resolve(obj, args, ctx) {
                const data = investor_data.find((investor) => {
                    return investor._id === args.id;
                });

                return data;

            },
        },
    },
});
