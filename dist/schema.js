"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var graphql_1 = require("graphql");
var rootqueryfile_1 = require("./rootqueryfile");
exports.Schema = new graphql_1.GraphQLSchema({
    query: rootqueryfile_1.RootQueryType,
});
