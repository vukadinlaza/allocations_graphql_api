"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var graphql_1 = require("graphql");
exports.IInvestorType = new graphql_1.GraphQLObjectType({
    name: "IInvestorType",
    fields: {
        investor_id: { type: graphql_1.GraphQLString },
        investor_name: { type: graphql_1.GraphQLString },
        investor_residence: { type: graphql_1.GraphQLString },
    }
});
