
import assert from "assert";
import { Db, ObjectId } from "mongodb";
/**
 * Delete deal function 
 * @param db Database instance
 * @param dealId  Deal documents ID (Mongo Object ID )
 */
export const deleteDeal = (db: Db, dealId: string) => {

    const q = {
        _id: new ObjectId(dealId),
    };

    return db.collection("deals")
        .deleteOne(q)
        .then((res) => {
            assert.equal(1, res.deletedCount);
            return res.deletedCount;
        }).catch((err) => {
            return err;
        });
};
