import { Db } from "mongodb";
import { IDeal } from "../../models/Deal";

/**
 * Return all deal collection documents
 * @param db Database instance 
 * @param projection Mongo projection (Default null)
 */
export const getAllDeals = (db: Db, projection?: object | undefined) => {
    const q = {};
    // projection = projection || { _id: 1 };
    
    return db
        .collection<IDeal>("deals")
        .find(q)
        .sort({ createdAt: -1 })
        // .project(projection)
        .toArray();
};

// Sorty data by timestamp
