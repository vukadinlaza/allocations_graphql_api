import { GraphQLList, GraphQLNonNull, GraphQLObjectType, GraphQLString } from "graphql";
import { IContextType } from "./IContextType";
import { getAllDeals, getAllInvestor, getDealById, getInvestorById } from "../mongo/queries";
import { IDealType } from "../types/IDealType";
import { IUserType } from "../types/IUserType";
import { IInvestorType } from "../types/IInvestorType";
import { IInvestmentType } from "../types/IInvestmentType";

import * as investors from "../mongo/investors"
import * as investments from "../mongo/investments"

export const RootQueryType = new GraphQLObjectType({
    name: "RootQueryType",
    fields: {
        GetDeals: {
            type: new GraphQLList(IDealType),
            resolve(obj, args, ctx: IContextType) {
                return getAllDeals(ctx.db).then((data) => {
                    return data;
                }).catch(err => console.log(err))
            }
        },
        GetDealById: {
            type: IDealType,
            args: {
                id: { type: new GraphQLNonNull(GraphQLString) },
            },
            resolve(obj, args, ctx: IContextType) {
                console.log({ctx})
                return getDealById(ctx.db, args.id);
            }
        },

        GetInvestors: {
            type: new GraphQLList(IInvestorType),
            resolve(obj, args, ctx: IContextType) {
                return investors.all(ctx);
            }
        },
        
        GetInvestorById: {
            type: IInvestorType,
            args: {
                id: { type: new GraphQLNonNull(GraphQLString) },
            },
            resolve(obj, args, ctx: IContextType) {
                return investors.get(args.id, ctx);
            }
        },

        investor: {
            type: IUserType,
            args: {
                email: { type: new GraphQLNonNull(GraphQLString) },
            },
            resolve(obj, args, ctx: IContextType) {
                return investors.get(args.id, ctx);
            }
        },

        investments: {
            type: new GraphQLList(IInvestmentType),
            resolve(obj, args, ctx: IContextType) {
                return investments.all(ctx);
            }
        }
    },
});
