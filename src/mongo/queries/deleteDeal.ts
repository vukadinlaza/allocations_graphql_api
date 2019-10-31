
import { Db, ObjectId } from "mongodb";

export const deleteDeal = (db: Db, dealId: string) => {
    
    const q = {
        _id: new ObjectId(dealId),
    };

    return db.collection("deals").deleteOne(q).then((res) =>{
     return   res.deletedCount;
    });
};
