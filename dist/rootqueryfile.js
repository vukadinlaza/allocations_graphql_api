"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var graphql_1 = require("graphql");
var IInvestor_1 = require("./types/IInvestor");
exports.RootQueryType = new graphql_1.GraphQLObjectType({
    name: 'RootQueryType',
    fields: {
        investor: {
            type: IInvestor_1.IInvestorType,
            resolve: function () {
                var data = {
                    investor_id: "123123",
                    investor_name: "Tanver",
                    investor_residence: "USA",
                };
                return data;
            }
        }
    }
});
