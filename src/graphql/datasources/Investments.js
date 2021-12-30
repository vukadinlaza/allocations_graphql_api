const { MongoDataSource } = require("apollo-datasource-mongodb");
const { capitalize } = require("lodash");
const { ObjectId } = require("mongodb");
const fetch = require("node-fetch");

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
    this.#updateServiceInvestment(_id, legacyInvestment);
  }

  async createInvestment({ deal, user, investment }) {
    const createdLegacyInvestment = await this.collection.insertOne(investment);

    await this.#createServiceInvestment({
      investment_id: createdLegacyInvestment.insertedId,
      deal,
      user,
      legacyInvestment: investment,
    });

    return createdLegacyInvestment;
  }

  async #createServiceInvestment({
    investment_id,
    deal,
    user,
    legacyInvestment,
  }) {
    try {
      const serviceInvestment = {
        _id: investment_id,
        user_id: user._id,
        phase: legacyInvestment.status,
        investor_email: user.email,
        total_committed_amount: legacyInvestment.amount,
        transactions: [
          {
            committed_amount: legacyInvestment.amount,
            wired_amount: legacyInvestment.capitalWiredAmount,
            wired_date: legacyInvestment.wired_at,
          },
        ],
        investor_type: capitalize(
          legacyInvestment.submissionData?.investor_type
        ),
        investor_name:
          legacyInvestment.submissionData?.fullName || user.signer_full_name,
        investor_entity_name: legacyInvestment.submissionData?.legalName,
        investor_country: legacyInvestment.submissionData?.country,
        investor_state: legacyInvestment.submissionData?.state,
        accredited_investor_type:
          legacyInvestment.submissionData?.accredited_investor_status,
        carry_fee_percent: parseInt(deal.dealParams.totalCarry) / 100 || 0,
        management_fee_percent:
          parseInt(deal.dealParams.managementFees) / 100 || 0,
        metadata: {
          deal_id: legacyInvestment.deal_id,
        },
      };

      const res = await fetch(
        `${process.env.INVEST_API_URL}/api/v1/investments`,
        {
          method: "POST",
          headers: {
            "X-API-TOKEN": process.env.ALLOCATIONS_TOKEN,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(serviceInvestment),
        }
      );

      if (!res.ok) throw new Error("Unable to create service investment");
    } catch (e) {
      console.error(e);
    }
  }

  async #updateServiceInvestment(_id, legacyInvestment) {
    try {
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

      const res = await fetch(
        `${process.env.INVEST_API_URL}/api/v1/investments/${_id}`,
        {
          method: "PATCH",
          headers: {
            "X-API-TOKEN": process.env.ALLOCATIONS_TOKEN,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(serviceInvestment),
        }
      );

      if (!res.ok) throw new Error("Unable to update service investment");
    } catch (e) {
      console.error(e);
    }
  }
}

module.exports = Investments;
