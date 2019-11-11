
import { Db, ObjectId } from "mongodb";

/**
 * Delete Investor document
 * @param db Mongo database connection instance
 * @param investorId Investor document ID (Mongo Object ID)
 */
export const deleteInvestor = (db: Db, investorId: string) => {
  const q = {
    _id: new ObjectId(investorId),
  };

  return db.collection("investors")
    .deleteOne(q)
    .then((res) => {
      return res.deletedCount;
    });
};
