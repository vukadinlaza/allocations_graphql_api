import { Db } from "mongodb";
import { IDeal } from "../../models/Deal";

export async function getAllDeals(db: Db, projection?: object | undefined) {
    const q = {};
   // projection = projection || { _id: 1 };

    return db
        .collection<IDeal>("deals")
        .find(q)
        // .project(projection)
        .toArray();
}
