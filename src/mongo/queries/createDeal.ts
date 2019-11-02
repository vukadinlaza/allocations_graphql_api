import assert from "assert";
import { Db, Timestamp } from "mongodb";
import { IDeal } from "../../models/Deal";


export const createDeal = (db: Db, deal: IDeal) => {

    if (!deal) {
        throw new Error("Must Provide Deal Object");
    }
    deal.operations_agreement = deal.operations_agreement ? deal.operations_agreement : "https://www.dropbox.com/s/35gxpnkm8u6f27q/Orbit%20Fab%20-%20Operating%20Agreement%20Template%20-%20Cell%20LLC.pdf?dl=0";
    deal.subscription_agreement = deal.subscription_agreement ? deal.subscription_agreement : "https://www.dropbox.com/s/5edhmdljz75tplx/Orbit%20Fab%20-%20Subscription%20Agreement%20-%20Cell%20LLC.pdf?dl=0";
    deal.private_placement_memorandum = deal.private_placement_memorandum ? deal.private_placement_memorandum : "https://www.dropbox.com/s/uctpnm7nxthsu8m/Orbit%20Fab%20-%20Private%20Placement%20Memorandum%20Template%20-%20Cell%20LLC.pdf?dl=0";


    deal.createdAt = Date.now().toString();
    return db
        .collection<IDeal>("deals")
        .insertOne(deal, { w: 1, wtimeout: 10000, serializeFunctions: true })
        .then((res) => {
            assert.equal(1, res.insertedCount);
            
            return res.ops[0];
        }).catch((err) => {
            console.log(err);
            return err;
        });
};