"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = __importDefault(require("express"));
var http_1 = require("http");
var apollo_server_express_1 = require("apollo-server-express");
var schema_1 = require("./schema");
var app = express_1.default();
var PORT = 4000;
var httpserver = http_1.createServer(app);
var server = new apollo_server_express_1.ApolloServer({
    schema: schema_1.Schema,
    subscriptions: { path: "/websocket" },
    context: function (_a) {
        var req = _a.req;
        req.headers.authorization;
    },
    cacheControl: {
        defaultMaxAge: 5,
    },
});
server.applyMiddleware({ app: app });
httpserver.listen(PORT, function () {
    console.log("\uD83D\uDE80 Server ready at http://localhost:" + PORT + server.graphqlPath);
    console.log("\uD83D\uDE80 Subscriptions ready at ws://localhost:" + PORT + server.subscriptionsPath);
});
