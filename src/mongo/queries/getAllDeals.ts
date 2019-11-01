import { Db } from "mongodb";
import { IDeal } from "../../models/Deal";

export const getAllDeals = (db: Db, projection?: object | undefined) => {
    const q = {};
    // projection = projection || { _id: 1 };

    return db
        .collection<IDeal>("deals")
        .find(q)
        .sort({createdAt: -1})
        // .project(projection)
        .toArray();
};

// Sorty data by timestamp
