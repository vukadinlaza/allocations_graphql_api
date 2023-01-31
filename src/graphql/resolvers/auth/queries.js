const fetch = require("node-fetch");
const { ApolloError } = require("apollo-server");
const { throwApolloError } = require("../../../utils/common.js");
const { retoolApps } = require("../../helpers/retool.js");

const Queries = {
  search_auth_users: async (_, { email }) => {
    try {
      const response = await fetch(
        `https://${process.env.AUTH0_DOMAIN}/oauth/token`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: `grant_type=client_credentials&client_id=${process.env.AUTH0_RWA_CLIENT_ID}&client_secret=${process.env.AUTH0_RWA_CLIENT_SECRET}&audience=https://${process.env.AUTH0_DOMAIN}/api/v2/`,
        }
      );
      const { access_token } = await response.json();

      const res = await fetch(
        `https://${
          process.env.AUTH0_DOMAIN
        }/api/v2/users-by-email?email=${encodeURIComponent(
          email.toLowerCase()
        )}`,
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        }
      );

      const data = await res.json();

      if (!res.ok) {
        const { error, errorCode, message } = data;
        throw new ApolloError(error, errorCode || "INTERNAL_SERVER_ERROR", {
          message: message || "Auth0 request failed",
        });
      }

      const identities = data.map((u) => u.identities).flat();
      const hasEmailConnection = !!identities.find(
        (i) => i?.connection === "email"
      );
      const hasPWConnection = !!identities.find(
        (i) => i?.connection === "Username-Password-Authentication"
      );

      return {
        hasEmailConnection,
        hasPWConnection,
      };
    } catch (e) {
      throwApolloError(e, "auth0 user search query");
    }
  },
  reset_password: async (_, { email }) => {
    const response = await fetch(
      `https://${process.env.AUTH0_DOMAIN}/dbconnections/change_password`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          client_id: process.env.AUTH0_RWA_CLIENT_ID,
          email: email,
          connection: "Username-Password-Authentication",
        }),
      }
    );

    if (response.status !== 200) {
      const { error, errorCode, message } = response;
      throw new ApolloError(error, errorCode || "INTERNAL_SERVER_ERROR", {
        message: message || "Auth0 request failed",
      });
    }

    return { success: true };
  },
  retoolEmbedUrl: async (_, { app }, { user }) => {
    const { apiUrl, landingPageUuid, groupIds, sessionDurationMinutes } =
      retoolApps[app];

    const options = {
      method: "POST",
      headers: {
        Authorization: `Bearer retool_01gr28vay1te4zgscrb4sxmtsm`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        landingPageUuid,
        externalIdentifier: user._id.toString(),
        groupIds,
        sessionDurationMinutes,
      }),
    };

    const response = await fetch(apiUrl, options);

    const data = await response.json();

    return data?.embedUrl;
  },
};

module.exports = Queries;
