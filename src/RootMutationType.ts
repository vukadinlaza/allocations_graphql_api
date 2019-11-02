import { GraphQLID, GraphQLNonNull, GraphQLObjectType, GraphQLString } from "graphql";
import { IContextType } from "./IContextType";
import { createDeal, createInvestor, deleteDeal, deleteInvestor, updateDeal } from "./mongo/queries";
import { DEAL_ADDED, DEAL_DELETED, pubsub } from "./RootSubscriptionType";
import { IDealInputType } from "./types/IDealInputType";
import { IDealDeleteType, IDealType } from "./types/IDealType";
import { IInvestorInputType } from "./types/IInvestorInputType";
import { IInvestorDeleteType, IInvestorType } from "./types/IInvestorType";



export const RootMutationType = new GraphQLObjectType({
    name: "RootMutationType",
    fields: {
        addDeal: {
            type: IDealType,
            args: {
                input: { type: new GraphQLNonNull(IDealInputType) },
            },
            resolve: (obj, args, ctx: IContextType) => {
                return ctx.getDb.then((db: any) => {
                    return createDeal(db, args.input).then((res) => {
                        pubsub.publish(DEAL_ADDED, { DealAdded: res });
                        return res;
                    }).catch((err) => {
                        console.log(err);
                        return err;
                    });
                });
            },
        },
        addInvestor: {
            type: IInvestorType,
            args: {
                input: { type: new GraphQLNonNull(IInvestorInputType) },
            },
            resolve: (obj, args, ctx: IContextType) => {
                return ctx.getDb.then((db: any) => {
                    return createInvestor(db, args.input);
                });
            },
        },
        deleteDealById: {
            type: IDealDeleteType,
            args: {
                id: { type: new GraphQLNonNull(GraphQLID) },
            },
            resolve: (obj, args, ctx: IContextType) => {
                return ctx.getDb.then((db: any) => {

                    return deleteDeal(db, args.id).then((res) => {
                        pubsub.publish(DEAL_DELETED, { DealAdded: "Deleted successfully" });
                        const data = {
                            _id: args.id,
                        };
                        return data;
                    });
                });
            },
        },
        deleteInvestorById: {
            type: IInvestorDeleteType,
            args: {
                id: { type: new GraphQLNonNull(GraphQLID) },
            },
            resolve: (obj, args, ctx: IContextType) => {
                return ctx.getDb.then((db: any) => {
                    return deleteInvestor(db, args.id).then((res) => {
                        console.log(res);
                        console.log(args.id);
                        const data = {
                            _id: args.id,
                        };
                        return data;
                    });
                });
            },
        },


        updateDeal: {
            type: IDealType,
            args: {
                input: { type: new GraphQLNonNull(IDealInputType) },
            },
            resolve: (obj, args, ctx: IContextType) => {
                return ctx.getDb.then((db: any) => {
                    return updateDeal(db, args.input).then(res => {
                        console.log("Mutation: " + res)
                        return res;
                    })
                });
            },
        },


    },

});