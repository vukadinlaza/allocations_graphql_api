import assert from "assert";
import { Db, Timestamp } from "mongodb";
import { IDeal } from "../../models/Deal";

/**
 * Create deal documents 
 * @param db  Database connection instance
 * @param deal  IDeal Type
 */
export const createDeal = (db: Db, deal: IDeal) => {

    if (!deal) {
        throw new Error("Must Provide Deal Object");
    }
    deal.operations_agreement = deal.operations_agreement ? deal.operations_agreement : "https://www.dropbox.com/s/35gxpnkm8u6f27q/Orbit%20Fab%20-%20Operating%20Agreement%20Template%20-%20Cell%20LLC.pdf?dl=0";
    deal.subscription_agreement = deal.subscription_agreement ? deal.subscription_agreement : "https://www.dropbox.com/s/5edhmdljz75tplx/Orbit%20Fab%20-%20Subscription%20Agreement%20-%20Cell%20LLC.pdf?dl=0";
    deal.private_placement_memorandum = deal.private_placement_memorandum ? deal.private_placement_memorandum : "https://www.dropbox.com/s/uctpnm7nxthsu8m/Orbit%20Fab%20-%20Private%20Placement%20Memorandum%20Template%20-%20Cell%20LLC.pdf?dl=0";
    deal.bank_account = deal.bank_account ? deal.bank_account : "https://www.dropbox.com/s/elqqczc5vx8qoi6/Bank%20Account.png?dl=0";
    deal.formation_certificate_filing = deal.formation_certificate_filing ? deal.formation_certificate_filing : "https://www.dropbox.com/s/rvg1icvmapnga49/Formation%20Certificate.jpg?dl=0";
    deal.ein_filing = deal.ein_filing ? deal.ein_filing : "https://www.dropbox.com/s/70w80yxkhh1w7rt/EIN.png?dl=0";
    deal.form_d_filing = deal.form_d_filing ? deal.form_d_filing : "https://www.dropbox.com/s/qlw1hxljv3rfafa/Form%20D.pdf?dl=0";
    deal.form_1065_filing = deal.form_1065_filing ? deal.form_1065_filing : "https://www.dropbox.com/s/ycb2qocc4l6wja7/Form%201065.pdf?dl=0";
    deal.w9_filing = deal.w9_filing ? deal.w9_filing : "https://www.dropbox.com/s/y6e8pf57h302onh/W9.pdf?dl=0"

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