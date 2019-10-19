import { GraphQLList, GraphQLNonNull, GraphQLObjectType, GraphQLString } from "graphql";
import { IContextType } from "./IContextType";
import { IDeal } from "./models/Deal";
import { IInvestor } from "./models/Investor";
import { getDealById } from "./mongo/queries";
import { getAllInvestor } from "./mongo/queries/geAlltInvestors";
import { getAllDeals } from "./mongo/queries/getAllDeals";
import { IDealType } from "./types/IDealType";
import { IInvestorType } from "./types/IInvestorType";
import { getInvestorById } from './mongo/queries/getInvestorById';

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
            resolve(obj, args, ctx: IContextType) {
                return ctx.getDb.then((db: any) => {
                    return getAllDeals(db).then((data) => {
                        console.log(data);
                        return data;
                    });
                });
            },
        },
        GetDealById: {
            type: IDealType,
            args: {
                id: { type: new GraphQLNonNull(GraphQLString) },
            },
            resolve(obj, args, ctx: IContextType) {
                return ctx.getDb.then((db: any) => {
                    return getDealById(db, args.id);
                });
            },
        },
        GetInvestors: {
            type: new GraphQLList(IInvestorType),
            resolve(obj, args, ctx: IContextType) {
                ctx.getDb.then((db: any) => {
                    return getAllInvestor(db).then((data) => {
                        console.log("All Investors : " + data);
                        return data;
                    });
                });
            },
        },
        GetInvestorById: {
            type: IInvestorType,
            args: {
                id: { type: new GraphQLNonNull(GraphQLString) },
            },
            resolve(obj, args, ctx: IContextType) {
                return ctx.getDb.then((db: any) => {
                    return getInvestorById(db, args.id);
                });

            },
        },
    },
});
