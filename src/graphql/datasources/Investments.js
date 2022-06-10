const { MongoDataSource } = require("apollo-datasource-mongodb");
const { capitalize, isNumber } = require("lodash");
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

  async resignInvestment({ investment_id, submissionData }) {
    await this.collection.updateOne(
      { _id: ObjectId(investment_id) },
      { $set: { submissionData } }
    );

    this.#resignServiceInvestment({ investment_id, submissionData });
  }

  async #createServiceInvestment({
    investment_id,
    deal,
    user,
    legacyInvestment,
  }) {
    if (legacyInvestment.status === "invited") return;
    const mgmtFeeIsNumber = !Number.isNaN(
      parseInt(deal.dealParams.managementFees)
    );
    const carryFeeIsNumber = !Number.isNaN(
      parseInt(deal.dealParams.totalCarry)
    );
    console.log("mgmt", mgmtFeeIsNumber);
    console.log("carrys", carryFeeIsNumber);
    console.log(
      "value",
      parseInt(deal.dealParams.managementFees),
      mgmtFeeIsNumber ? parseInt(deal.dealParams.managementFees) / 100 : 0
    );
    console.log(
      "carryFeeIsNumber",
      parseInt(deal.dealParams.managementFees),
      carryFeeIsNumber ? parseInt(deal.dealParams.managementFees) / 100 : 0
    );

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
          legacyInvestment.submissionData?.fullName ||
          legacyInvestment.submissionData?.legalName ||
          user.signer_full_name,
        investor_entity_name: legacyInvestment.submissionData?.legalName,
        investor_country: legacyInvestment.submissionData?.country,
        investor_state: legacyInvestment.submissionData?.state,
        accredited_investor_type:
          legacyInvestment.submissionData?.accredited_investor_status,
        carry_fee_percent: carryFeeIsNumber
          ? parseInt(deal.dealParams.totalCarry) / 100
          : 0,
        management_fee_percent: mgmtFeeIsNumber
          ? parseInt(deal.dealParams.managementFees) / 100
          : 0,
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

  async #resignServiceInvestment({ investment_id, submissionData }) {
    try {
      const amount = parseInt(
        submissionData.investmentAmount?.replace(/,/g, "")
      );
      const serviceInvestment = {
        _id: investment_id,
        total_committed_amount: amount,
        transactions: [
          {
            committed_amount: amount,
          },
        ],
        investor_type: capitalize(
          submissionData?.investor_type || "Individual"
        ),
        investor_name: submissionData.fullName || submissionData.legalName,
        investor_entity_name: submissionData.legalName,
        investor_country: submissionData.country,
        investor_state: submissionData.state,
        accredited_investor_type: submissionData.accredited_investor_status,
      };

      const res = await fetch(
        `${process.env.INVEST_API_URL}/api/v1/investments/${investment_id}/resign`,
        {
          method: "POST",
          headers: {
            "X-API-TOKEN": process.env.ALLOCATIONS_TOKEN,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(serviceInvestment),
        }
      );

      if (!res.ok) throw new Error("Unable to resign service investment");
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

  async updateInvestmentUserId({ investment_user_id, user_id }) {
    await this.collection.updateOne(
      { user_id: ObjectId(investment_user_id) },
      { $set: { user_id } }
    );
  }
}

module.exports = Investments;
