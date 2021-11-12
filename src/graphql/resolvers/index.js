const { GraphQLUpload } = require("graphql-upload");
/**

  merges all the resolvers into one typeDef and resolver names 'resolvers'

 **/

const resolversRaw = [
  "deals",
  "investors",
  "superadmin",
  "investments",
  "organizations",
  "documents",
  "accounts",
  "entities",
  "signingpackets",
  "comments",
  "applications",
  "newDirections",
].map((name) => require(`./${name}`));

const splatReduce = (key) =>
  resolversRaw.reduce((acc, r) => ({ ...acc, ...r[key] }), {});

const resolvers = {
  Query: splatReduce("Queries"),
  Mutation: splatReduce("Mutations"),
  Subscription: splatReduce("Subscriptions"),
  ...splatReduce("subResolvers"),
  Upload: GraphQLUpload,
};

module.exports = {
  typeDefs: resolversRaw.map((r) => r.Schema),
  resolvers,
};
