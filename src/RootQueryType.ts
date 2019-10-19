import { GraphQLList, GraphQLNonNull, GraphQLObjectType, GraphQLString } from "graphql";
import { IContextType } from "./IContextType";
import { getAllDeals, getAllInvestor, getDealById, getInvestorById } from "./mongo/queries";
import { IDealType } from "./types/IDealType";
import { IInvestorType } from "./types/IInvestorType";



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
