import jwt from "express-jwt";
import jwksRsa from "jwks-rsa";

const audience = "https://api.graphql.com"
// const domain = "allocations1.auth0.com"
const domain = "login.allocations.co"

export default jwt({
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `https://${domain}/.well-known/jwks.json`
  }),

  audience,
  issuer: `https://${domain}/`,
  algorithms: ["RS256"],
  credentialsRequired: false,
});