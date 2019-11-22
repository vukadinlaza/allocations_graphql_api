import { Db, ObjectId } from "mongodb";
import { IInvestor } from "../models/Investor";
import { IContextType } from "../graphql/IContextType"

/**
 * Return investor which matches provided ID
 * @param db MongoDB database connection instance
 * @param investorId investor documents ID (MongoDB Object ID)
 * @param projection (Optional) Mongodb projection - default null
 */
export const get = async (investorId: string, ctx: IContextType) => {
    const _id = new ObjectId(investorId) 

    // authorize - can only get if admin or is the actual investor
    if (ctx.user && (ctx.user.admin || ctx.user._id === _id)) {
        const investor = await ctx.db.collection("users").findOne({ _id });
        const investments = await ctx.db.collection("deals").find({ user_id: _id }).toArray();
        for (let i = 0; i < investments.length; i++) {
            investments[i].deal = await ctx.db.collection("deals").findOne({_id: investments[i].deal_id })
            investments[i].user = await ctx.db.collection("users").findOne({_id: investments[i].user_id })
        }
        investor.investments = investments
        return investor
    }
    return { error: "unauthorized" }
};

/**
 * Returns all investor collection documents
 * @param db Database connection instance
 * @param projection MongoDB projection
 */
export const all = (ctx: IContextType) => {
    if (ctx.user && ctx.user.admin) {
        return ctx.db
            .collection("investors")
            .find({})
            .toArray();
    }
    return { error: "unauthorized" }
};

/**
 * Create investor document 
 * @param db Database connections instance
 * @param investor IInvestor type 
 */
export const create = (db: Db, investor: IInvestor) => {
    if (!investor) {
        throw new Error("Must provide Investor Object");
    }
    return db
        .collection<IInvestor>("investors")
        .insertOne(investor, { w: 1 })
        .then((res) => {
            return res.ops[0];
        });
};

/**
 * Delete Investor document
 * @param db Mongo database connection instance
 * @param investorId Investor document ID (Mongo Object ID)
 */
export const destroy = (db: Db, investorId: string) => {
  const q = {
    _id: new ObjectId(investorId),
  };

  return db.collection("investors")
    .deleteOne(q)
    .then((res) => {
      return res.deletedCount;
    });
};