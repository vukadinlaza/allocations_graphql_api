import { GraphQLList, GraphQLNonNull, GraphQLObjectType, GraphQLString } from "graphql";
import { IContextType } from "./IContextType";
import { getAllDeals, getAllInvestor, getDealById, getInvestorById } from "../mongo/queries";
import { IDealType } from "../types/IDealType";
import { IInvestorType } from "../types/IInvestorType";

import * as investors from "../mongo/investors"

export const RootQueryType = new GraphQLObjectType({
    name: "RootQueryType",
    fields: {
        GetDeals: {
            type: new GraphQLList(IDealType),
            resolve(obj, args, ctx: IContextType) {
                return getAllDeals(ctx.db).then((data) => {
                    return data;
                }).catch(err => console.log(err))
            },
        },
        GetDealById: {
            type: IDealType,
            args: {
                id: { type: new GraphQLNonNull(GraphQLString) },
            },
            resolve(obj, args, ctx: IContextType) {
                return getDealById(ctx.db, args.id);
            },
        },

        GetInvestors: {
            type: new GraphQLList(IInvestorType),
            resolve(obj, args, ctx: IContextType) {
                return investors.all(ctx.db).then((data) => {
                    return data;
                });
            },
        },
        
        GetInvestorById: {
            type: IInvestorType,
            args: {
                id: { type: new GraphQLNonNull(GraphQLString) },
            },
            resolve(obj, args, ctx: IContextType) {
                return investors.get(ctx.db, args.id);
            },
        },
    },
});
