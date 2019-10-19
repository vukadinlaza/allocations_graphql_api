import { Db } from "mongodb";
import { IDeal } from "../../models/Deal";


export const createDeal = (db: Db, deal: IDeal) => {

    if (!deal) {
        throw new Error("Must Provide Deal Object");
    }
    return db
        .collection<IDeal>("deals")
        .insertOne(deal, { w: 1 })
        .then((res) => {
            return res.ops[0];
        });

};