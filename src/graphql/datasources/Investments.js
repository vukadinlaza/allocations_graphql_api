const { MongoDataSource } = require("apollo-datasource-mongodb");
const { ObjectId } = require("mongodb");
const { InvestmentService } = require("@allocations/investment-service");
const { transformLegacyInvestment } = require("./investment-utils");

class Investments extends MongoDataSource {
  async getOneInvestment(query) {
    return this.collection.findOne(query);
  }

  async getInvestmentById({ investment_id }) {
    return this.collection.findOne({
      _id: ObjectId(investment_id),
    });
  }

  async getAllInvestments(query) {
    console.log("query==>", query);
    return this.collection.find(query).toArray();
  }

  async updateInvestmentById({ _id, investment }) {
    console.log("onUpdate", investment);
    const serviceInvestment = transformLegacyInvestment(investment);
    const i = await InvestmentService.update(_id, serviceInvestment);
    console.log("i==>", i);
    return i;
  }

  async createInvestment(investment) {
    const newServiceInvestment = transformLegacyInvestment(investment);
    await InvestmentService.create(newServiceInvestment);
    const legacyInvestment = await this.collection.insertOne({ ...investment });
    // const insertedInvestment = await this.collection.findOne({ _id: ObjectId(newInvestment._id) });
    return legacyInvestment.insertedId;
  }
}

module.exports = Investments;
