const { GraphQLUpload } = require("graphql-upload");
const fs = require("fs");
/**

  merges all the resolvers into one typeDef and resolver names 'resolvers'

 **/

const resolversNames = fs
  .readdirSync(`${__dirname}`)
  .filter((file) => !file.includes("index.js"));

const resolversRaw = resolversNames.map((name) => {
  if (name.includes(".js")) {
    return require(`./${name}`);
  } else {
    const possibleFiles = {
      queries: "Queries",
      mutations: "Mutations",
      subresolvers: "subResolvers",
    };
    const resolverFiles = fs
      .readdirSync(`${__dirname}/${name}`)
      .filter((file) => !file.includes("index.js"))
      .map((file) => file.split(".")[0]);
    const groupResolvers = {
      Schema: require(`../schema/${name}`),
    };

    resolverFiles.forEach((file) => {
      groupResolvers[possibleFiles[file]] = require(`./${name}/${file}`);
    });
    return groupResolvers;
  }
});

const splatReduce = (key) =>
  resolversRaw.reduce((acc, r) => ({ ...acc, ...r[key] }), {});

const resolvers = {
  Query: splatReduce("Queries"),
  Mutation: splatReduce("Mutations"),
  ...splatReduce("subResolvers"),
  Upload: GraphQLUpload,
};

module.exports = {
  typeDefs: resolversRaw.map((r) => r.Schema),
  resolvers,
};
