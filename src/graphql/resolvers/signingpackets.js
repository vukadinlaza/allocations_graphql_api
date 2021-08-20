const { gql } = require("apollo-server-express");

const Schema = gql`
  extend type Mutation {
    createSigningPacket(payload: Object): Boolean
  }
`;

const Mutations = {
  createSigningPacket: async () => {
    return true;
  },
};

module.exports = {
  Schema,
  Mutations,
};
