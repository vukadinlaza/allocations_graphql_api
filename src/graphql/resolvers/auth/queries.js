const fetch = require("node-fetch");
const { throwApolloError } = require("../../../utils/common.js");

const Queries = {
  search_auth0_users: async (_, { email }) => {
    try {
      const response = await fetch(
        `https://${process.env.AUTH0_DOMAIN}/oauth/token`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: `grant_type=client_credentials&client_id=${process.env.AUTH0_RWA_CLIENT_ID_T}&client_secret=${process.env.AUTH0_RWA_CLIENT_SECRET_T}`,
        }
      );
      const { access_token } = await response.json();

      const res = await fetch(
        `https://${process.env.AUTH0_DOMAIN}/api/v2/users-by-email?email=${email}`,
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        }
      );
      const data = await res.json();
      const identities = data.map((u) => u.identities).flat();
      const hasEmailConnection = identities.find(
        (i) => i?.connection === "email"
      );
      const hasPWConnection = identities.find(
        (i) => i?.connection === "Username-Password-Authentication"
      );

      return {
        data: {
          hasEmailConnection: hasEmailConnection ? true : false,
          hasPWConnection: hasPWConnection ? true : false,
        },
      };
    } catch (e) {
      throwApolloError(e, "auth0 user search query");
    }
  },
};

module.exports = Queries;
