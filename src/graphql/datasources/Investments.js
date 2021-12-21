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
    return this.collection.find(query).toArray();
  }

  async updateInvestmentById({ _id, investment }) {
    const serviceInvestment = transformLegacyInvestment({
      _id: investment._id,
      legacyInvestment: investment,
    });
    return InvestmentService.update(_id, serviceInvestment);
  }

  async createInvestment(investment) {
    const createdInvestment = await this.collection.insertOne(investment);
    const serviceInvestment = transformLegacyInvestment({
      _id: createdInvestment.insertedId,
      legacyInvestment: investment,
    });
    await InvestmentService.create(serviceInvestment);
    return createdInvestment;
  }
}

module.exports = Investments;
