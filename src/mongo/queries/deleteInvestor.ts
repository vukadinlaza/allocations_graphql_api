
import { Db, ObjectId } from "mongodb";

export const deleteInvestor = (db: Db, investorId: string) => {
    const q = {
        _id: new ObjectId(investorId),
    };

    return db.collection("investors").deleteOne(q).then(res=>{
      return  res.deletedCount;
    });
};
