import { Db, ObjectId } from "mongodb";
import { IInvestor } from "../models/Investor";

/**
 * Return investor which matches provided ID
 * @param db MongoDB database connection instance
 * @param investorId investor documents ID (MongoDB Object ID)
 * @param projection (Optional) Mongodb projection - default null
 */
export const get = async (db: Db, investorId: string, projection?: object | undefined) => {
    const q = { _id: new ObjectId(investorId) };
    const investor = await db.collection("investors").findOne(q, { fields: projection });
    investor.deals = await db.collection("deals").find({ user_id: investor.email }).toArray();

    return investor
};

/**
 * Returns all investor collection documents
 * @param db Database connection instance
 * @param projection MongoDB projection
 */
export const all = (db: Db, projection?: object | undefined) => {
    return db
        .collection<IInvestor>("investors")
        .find({})
        .toArray();
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