import { Db } from "mongodb";
import { IInvestor } from "../../models/Investor";

export const createInvestor = (db: Db, investor: IInvestor) => {
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
