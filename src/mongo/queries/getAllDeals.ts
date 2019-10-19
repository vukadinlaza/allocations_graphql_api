import { Db } from "mongodb";
import { IDeal } from "../../models/Deal";

export const getAllDeals = (db: Db, projection?: object | undefined) => {
    const q = {};
    // projection = projection || { _id: 1 };

    return db
        .collection<IDeal>("deals")
        .find(q)
        // .project(projection)
        .toArray();
};
