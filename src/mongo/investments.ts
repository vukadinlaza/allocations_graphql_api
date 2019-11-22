import { ObjectId } from "mongodb";
import { IContextType } from "../graphql/IContextType"

/**
 * Returns all investor collection documents
 * @param db Database connection instance
 */
export const all = async (ctx: IContextType) => {
    const q = !ctx.user.admin ? { email: ctx.user.email } : {}

    const investments = await ctx.db.collection("investments").find(q).toArray();
    for (let i = 0; i < investments.length; i++) {
        investments[i].deal = await ctx.db.collection("deals").findOne({_id: investments[i].deal_id })
        investments[i].user = await ctx.db.collection("users").findOne({_id: investments[i].user_id })
    }
    return investments
};