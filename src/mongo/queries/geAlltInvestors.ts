
import { Db } from "mongodb";
import { IInvestor } from "../../models/Investor";

/**
 * Returns all investor collection documents
 * @param db Database connection instance
 * @param projection MongoDB projection
 */
export const getAllInvestor = (db: Db, projection?: object | undefined) => {
    const q = {};
    //  projection = projection;

    return db
        .collection<IInvestor>("investors")
        .find(q)
        //    .project(projection)
        .toArray();

};
