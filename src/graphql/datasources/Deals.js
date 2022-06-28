const { MongoDataSource } = require("apollo-datasource-mongodb");
const { ObjectId } = require("mongodb");
const { DealService } = require("@allocations/deal-service");
const { transformServiceDeal, transformLegacyDeal } = require("./utils");

class Deals extends MongoDataSource {
  async getDealById({ deal_id }) {
    return this.collection.findOne({ _id: ObjectId(deal_id) });
  }

  async getDealByOrgIdAndDealslug({ fund_id, deal_slug }) {
    return this.collection.findOne({
      slug: deal_slug,
      organization: fund_id,
    });
  }

  async getAllDeals({ query }) {
    console.log(query);
    const legacyDeals = await this.collection.find(query).toArray();
    return legacyDeals;
  }
  async findDealsByFields({ query }) {
    const legacyDeals = await this.collection.find({ ...query }).toArray();
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
  }

  async createDeal({ deal, user_id }) {
    const { insertedId: _id } = await this.collection.insertOne({
      ...deal,
      user_id,
    });
    const newDeal = await this.collection.findOne({ _id });

    console.log(newDeal);

    return newDeal;
  }

  async deleteDealById({ deal_id }) {
    const deletedLegacyDeal = await this.collection.deleteOne({
      _id: ObjectId(deal_id),
    });
    if (deletedLegacyDeal.acknowledged) {
      return deletedLegacyDeal.acknowledged;
    }

    const deletedServiceDeal = await DealService.deleteDealById(deal_id);
    return deletedServiceDeal.acknowledged;
  }

  async getDealsByOrg(_id) {
    const legacyDeals = await this.collection
      .find({
        organization: ObjectId(_id),
      })
      .toArray();
    const legacyDealsIds = legacyDeals.map((d) => JSON.stringify(d._id));
    const newDeals = await DealService.getAllDeals({
      organization_id: ObjectId(_id),
    });
    const transformedDeals = newDeals
      .filter((deal) => {
        return !legacyDealsIds.includes(JSON.stringify(deal._id));
      })
      .map((deal) => transformServiceDeal({ serviceDeal: deal }));
    return [...legacyDeals, ...transformedDeals];
  }
}

module.exports = Deals;
