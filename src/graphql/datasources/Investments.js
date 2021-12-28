const { MongoDataSource } = require("apollo-datasource-mongodb");
const { ObjectId } = require("mongodb");
const { InvestmentService } = require("@allocations/investment-service");

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

  async updateInvestmentById(_id, legacyInvestment) {
    const serviceInvestment = {
      phase: legacyInvestment.status,
      transactions: [
        {
          committed_amount: legacyInvestment.amount,
          wired_amount: legacyInvestment.capitalWiredAmount,
          wired_date: legacyInvestment.wired_at,
        },
      ],
      investor_type: legacyInvestment.submissionData?.investor_type,
      investor_entity_name: legacyInvestment.submissionData?.legalName,
      investor_country: legacyInvestment.submissionData?.country,
      investor_state: legacyInvestment.submissionData?.state,
      accredited_investor_type:
        legacyInvestment.submissionData?.accredited_investor_status,
    };
    const updatedInvestment = await InvestmentService.update(
      ObjectId(_id),
      serviceInvestment
    );
    return updatedInvestment;
  }

  async createInvestment(legacyInvestment, db) {
    const user = await db.users.findOne({
      _id: ObjectId(legacyInvestment.user_id),
    });

    const createdLegacyInvestment = await this.collection.insertOne(
      legacyInvestment
    );
    const serviceInvestment = {
      _id: createdLegacyInvestment.insertedId,
      deal_id: legacyInvestment.deal_id,
      user_id: user._id,
      phase: legacyInvestment.status,
      investor_email: user.email,
      transactions: [
        {
          committed_amount: legacyInvestment.amount,
          wired_amount: legacyInvestment.capitalWiredAmount,
          wired_date: legacyInvestment.wired_at,
        },
      ],
      investor_type: legacyInvestment.submissionData?.investor_type,
      investor_entity_name: legacyInvestment.submissionData?.legalName,
      investor_country: legacyInvestment.submissionData?.country,
      investor_state: legacyInvestment.submissionData?.state,
      accredited_investor_type:
        legacyInvestment.submissionData?.accredited_investor_status,
    };

    await InvestmentService.create(serviceInvestment);
    return createdLegacyInvestment;
  }
}

module.exports = Investments;
