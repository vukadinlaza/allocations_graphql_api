/**

  merges all the resolvers into one typeDef and resolver names 'resolvers'

 **/

const resolversRaw = [
  'auth',
  'deals',
  'exchange',
  'investors',
  'superadmin',
  'investments',
  'organizations',
  'marketplace',
  'documents',
  'accounts',
  'entities',
  'signingpackets',
  'comments',
  'applications'
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
