import { Db, ObjectId } from "mongodb";
import { IDeal } from "../../models/Deal";


export const getDealById = (db: Db, dealId: string, projection?: object | undefined) => {
  //  projection = projection || { _id: 1 };
    console.log(dealId);
    const q = {
        _id: new ObjectId(dealId),
    };
    console.log(q);

    const hints = {
        dealId: 1,
    };

    return db.collection("deals").findOne(q, {fields: projection});

    // return db
    //     .collection<IDeal>("deals")
    //     .find(q)
    //   //  .project(projection)
    //     .hint(hints)
    //     .toArray((err, docs) => {
    //         console.log(docs);
    //         return docs[0];
    //     });
};
