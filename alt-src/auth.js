const jwt = require("express-jwt")
const jwksRsa = require("jwks-rsa")

const audience = "https://api.graphql.com"
// const domain = "allocations1.auth0.com"
const domain = "login.allocations.co"

module.exports = jwt({
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