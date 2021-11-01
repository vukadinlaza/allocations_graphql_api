const { MongoDataSource } = require("apollo-datasource-mongodb");
const { ObjectId } = require("mongodb");
/*
REMOVED IN FAVOR OF USING ONLY LEGACY DB
const { DealService } = require("@allocations/deal-service");
const { transformServiceDeal, transformLegacyDeal } = require("./utils");
*/

class Deals extends MongoDataSource {
  async getDealById({ deal_id }) {
    let deal = await this.collection.findOne({ _id: ObjectId(deal_id) });
    /*
    REMOVED IN FAVOR OF USING ONLY LEGACY DB
    if (!deal) {
      const serviceDeal = await DealService.get(deal_id);

      deal = transformServiceDeal({ serviceDeal });
    }
    */
    return deal;
  }

  async getDealByOrgIdAndDealslug({ fund_id, deal_slug }) {
    let deal = await this.collection.findOne({
      slug: deal_slug,
      organization: fund_id,
    });
    /*
    REMOVED IN FAVOR OF USING ONLY LEGACY DB
    if (!deal) {
      const serviceDeal = await DealService.getDealByFundIDAndDealSlug(
        fund_id,
        deal_slug
      );
      const coverImage = await DealService.getDocumentByTaskTitle(
        serviceDeal._id,
        "build",
        "Upload Company Logo"
      );

      deal = transformServiceDeal({ serviceDeal, coverImage });
    }
    */
    return deal;
  }

  async getAllDeals({ query }) {
    const legacyDeals = await this.collection.find(query).toArray();
    /*
    REMOVED IN FAVOR OF USING ONLY LEGACY DB
    const serviceDeals = await DealService.getAllDeals({
      ...query,
      organization_id: query?.organization,
    });
    return [
      ...legacyDeals,
      ...(serviceDeals || []).map((d) =>
        transformServiceDeal({ serviceDeal: d })
      ),
    ];
    */
    return legacyDeals;
  }
  async findDealsByFields({ query }) {
    const legacyDeals = await this.collection.find({ ...query }).toArray();
    /*
    REMOVED IN FAVOR OF USING ONLY LEGACY DB
    const serviceDeals = await DealService.getAllDeals(query);

    return [
      ...legacyDeals,
      ...serviceDeals.map((d) => transformServiceDeal({ serviceDeal: d })),
    ];
    */
    return legacyDeals;
  }
  async updateDealById({ deal_id, deal }) {
    let updatedDeal = await this.collection.findOneAndUpdate(
      { _id: ObjectId(deal_id) },
      {
        $set: { ...deal, updated_at: Date.now() },
      },
      { returnDocument: "after" }
    );
    /*
    REMOVED IN FAVOR OF USING ONLY LEGACY DB
    if (updatedDeal.value !== null) {
      return updatedDeal.value;
    }

    const serviceDeal = await DealService.get(deal_id);
    const serviceDealTransformed = transformServiceDeal({ serviceDeal });

    const dealData = {
      deal_id,
      ...transformLegacyDeal({
        legacyDeal: { ...serviceDealTransformed, ...deal },
      }),
    };
    const updatedServiceDeal = await DealService.updateDealById(dealData);
    return transformServiceDeal({
      serviceDeal: await DealService.get(updatedServiceDeal._id),
    });
    */
    return updatedDeal;
  }

  async createDeal({ deal, user_id }) {
    /*
  REMOVED IN FAVOR OF USING ONLY LEGACY DB
  const newDeal = await DealService.create(user_id);
  await DealService.setBuildInfo(newDeal._id, transformLegacyDeal(deal));
  return DealService.get(newDeal._id);
  */
    const { insertedId: _id } = await this.collection.insertOne({
      ...deal,
      user_id,
    });
    const newDeal = await this.collection.findOne({ _id });

    return newDeal;
  }

  async deleteDealById({ deal_id }) {
    const deletedLegacyDeal = await this.collection.deleteOne({
      _id: ObjectId(deal_id),
    });
    /*
    REMOVED IN FAVOR OF USING ONLY LEGACY DB
    if (deletedLegacyDeal.acknowledged) {
      return deletedLegacyDeal.acknowledged;
    }
    const deletedServiceDeal = await DealService.deleteDealById(deal_id);
    return deletedLegacyDeal.acknowledged;
    */
    return deletedLegacyDeal.acknowledged;
  }
}

module.exports = Deals;
