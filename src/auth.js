const ms = require('ms')
const jwt = require('jsonwebtoken')
const jwksClient = require('jwks-rsa')
const { AuthenticationError } = require('apollo-server-express')
const logger = require('pino')({ prettyPrint: process.env.NODE_ENV !== "production" })

const client = jwksClient({
  cache: true,
  cacheMaxEntries: 1000,
  cacheMaxAge: ms('30d'),
  jwksUri: `https://login.allocations.co/.well-known/jwks.json`
})

const options = {
  domain: "login.allocations.co",
  client_id: "R2iJsfjNPGNjIdPmRoE3IcKd9UvVrsp1"
}

function getKey(header, cb){
  client.getSigningKey(header.kid, function(err, key) {
    var signingKey = key.publicKey || key.rsaPublicKey;
    cb(null, signingKey);
  })
}

async function verify(token) {
  return new Promise((resolve, reject) => {
    jwt.verify(token, getKey, options, (err, decoded) => {
      if (err) {
        return reject(AuthenticationError)
      }
      return resolve(decoded)
    })
  })
}

async function authenticate({ req, db }) {
  try {
    const token = (req.headers.authorization || "").slice(7)
    const data = await verify(token)

    const user = await db.collection("users").findOne({ email: data["https://dashboard.allocations.co/email"] })
    if (user) {
      // attaches .orgs to org admins
      if (user.organizations_admin) {
        user.orgs = await db.collection("organizations").find({ _id: { $in: user.organizations_admin } }).toArray()
      }

      return user
    }

    // else create user
    const res = await db.collection("users").insertOne({ email:  data["https://dashboard.allocations.co/email"] })
    return res.ops[0]
  } catch (e) {
    logger.error(e)
    throw new AuthenticationError()
  }
}

module.exports = { verify, authenticate }