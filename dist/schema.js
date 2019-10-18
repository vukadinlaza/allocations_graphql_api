"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var graphql_1 = require("graphql");
var RootQueryType_1 = require("./RootQueryType");
exports.Schema = new graphql_1.GraphQLSchema({
    query: RootQueryType_1.RootQueryType,
});
