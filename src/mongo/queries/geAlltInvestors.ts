
import { Db } from "mongodb";
import { IInvestor } from "../../models/Investor";

export const getAllInvestor = (db: Db, projection?: object | undefined) => {
    const q = {};
    //  projection = projection;

    return db
        .collection<IInvestor>("investors")
        .find(q)
        //    .project(projection)
        .toArray();

};
