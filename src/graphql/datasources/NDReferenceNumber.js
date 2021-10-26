const { MongoDataSource } = require("apollo-datasource-mongodb");
const {
  ReferenceNumberService,
} = require("@allocations/reference-number-service");
const { ApolloError } = require("apollo-server-errors");

class NDReferenceNumber extends MongoDataSource {
  async getByDealId({ deal_id }) {
    const res = await ReferenceNumberService.getByDealId({ deal_id });
    if (res.statusCode != "200") throw new ApolloError(res.body.message);
    return res.body;
  }

  async assignReferenceNumber({ deal_id }) {
    const res = await ReferenceNumberService.assign({ deal_id });
    return res;
  }
}

module.exports = NDReferenceNumber;
