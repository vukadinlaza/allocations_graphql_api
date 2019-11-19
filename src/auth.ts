import jwt from "express-jwt";
import jwksRsa from "jwks-rsa";

const domain = process.env.AUTH0_DOMAIN

export default jwt({
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `https://${domain}/.well-known/jwks.json`
  }),

  audience: "https://api.graphql.com",
  issuer: `https://${domain}/`,
  algorithms: ["RS256"],
  credentialsRequired: false,
});