/** 
  
  merges all the resolvers into one typeDef and resolver

 **/

const resolversRaw = [
  'auth',
  'deals',
  'exchange',
  'investors',
  'superadmin',
  'investments',
  'organizations',
  'documents'
].map(name => require(`./${name}`))

const splatReduce = (key) => resolversRaw.reduce((acc, r) => ({ ...acc, ...r[key] }), {})

const resolvers = {
  Query: splatReduce("Queries"),
  Mutation: splatReduce("Mutations"),
  ...splatReduce("subResolvers")
}

module.exports = {
  typeDefs: resolversRaw.map(r => r.Schema),
  resolvers
}

