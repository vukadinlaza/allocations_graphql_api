const { MongoDataSource } = require("apollo-datasource-mongodb");
const { ObjectId } = require("mongodb");
const { DealService } = require("@allocations/deal-service");
const { transformServiceDeal, transformLegacyDeal } = require("./utils");
class Deals extends MongoDataSource {
  async getDealById({ deal_id }) {
    let deal = await this.collection.findOne({ _id: ObjectId(deal_id) });
    if (!deal) {
      const serviceDeal = await DealService.get(deal_id);
      deal = transformServiceDeal({ serviceDeal });
    }
    return deal;
  }

  async getDealByOrgIdAndDealslug({ fund_id, deal_slug }) {
    let deal = await this.collection.findOne({
      slug: deal_slug,
      organization: fund_id,
    });
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
    return deal;
  }

  async getAllDeals({ query }) {
    const legacyDeals = await this.collection.find(query).toArray();
    const serviceDeals = await DealService.getAllDeals(query);
    return [
      ...legacyDeals,
      ...serviceDeals.map((d) => transformServiceDeal({ serviceDeal: d })),
    ];
  }
  async findDealsByFields({ query }) {
    const legacyDeals = await this.collection.find({ ...query }).toArray();
    const serviceDeals = await DealService.getAllDeals(query);

    return [
      ...legacyDeals,
      serviceDeals.map((d) => transformServiceDeal({ serviceDeal: d })),
    ];
  }
  async updateDealById({ deal_id, deal }) {
    let updatedDeal = await this.collection.findOneAndUpdate(
      { _id: ObjectId(deal_id) },
      {
        $set: {
          ...deal,
          updated_at: Date.now(),
        },
      },
      { returnOriginal: false }
    );

    if (updatedDeal) {
      return updatedDeal.value;
    }
    const updatedServiceDeal = await DealService.setBuildInfo(
      deal_id,
      transformLegacyDeal(deal)
    );
    return DealService.get(updatedServiceDeal._id);
  }
  async createDeal({ deal, user_id }) {
    const newDeal = await DealService.create(user_id);
    await DealService.setBuildInfo(newDeal._id, transformLegacyDeal(deal));
    return DealService.get(newDeal._id);
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
}

module.exports = Deals;
