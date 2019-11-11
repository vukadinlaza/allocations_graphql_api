


import { Db, ObjectId } from "mongodb";
import { IDeal } from "../../models/Deal";
import { IInvestor } from "../../models/Investor";

/**
 * Return investor which matches provided ID
 * @param db MongoDB database connection instance
 * @param investorId investor documents ID (MongoDB Object ID)
 * @param projection (Optional) Mongodb projection - default null
 */

export const getInvestorById = (db: Db, investorId: string, projection?: object | undefined) => {
    const q = {
        _id: new ObjectId(investorId),
    };
    console.log(q);

    const hints = {
        investorId: 1,
    };
    // projection = projection || { _id: 1 };

    return db.collection("investors").findOne(q, { fields: projection });
};
