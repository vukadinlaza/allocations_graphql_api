
import assert from "assert";
import { Db, DBRef, ObjectID } from "mongodb";
import { IDeal } from "../../models/Deal";

export const updateDeal = (db: Db, deal: IDeal) => {
    console.log(deal);
    const f = { _id: new ObjectID(deal._id) };
    const data: IDeal = {
        entity_name: deal.entity_name,
        deal_name: deal.deal_name,
        amount_wired: deal.amount_wired,
        total_investors: deal.total_investors,
        deal_complete_date: deal.deal_complete_date,
        operations_agreement: deal.operations_agreement,
        subscription_agreement: deal.subscription_agreement,
        private_placement_memorandum: deal.private_placement_memorandum,
        updatedAt: Date.now().toString(),
        investors: deal.investors,
    };
    return db.collection("deals")
        .findOneAndUpdate(f, { $set: { ...data } }, { upsert: false, w: 1 })
        .then((res) => {
            //  assert.equal(1, res.ok);
            console.log(res);
            return res.value;
        }).catch((err) => {
            console.log(err);
            return err;
        });
};
