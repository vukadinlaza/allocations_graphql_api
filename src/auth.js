const ms = require('ms')
const jwt = require('jsonwebtoken')
const jwksClient = require('jwks-rsa')
const fetch = require('node-fetch');
const { AuthenticationError } = require('apollo-server-express')
const { createUserAccountAndEntity } = require('./utils/createUser')
const logger = require('pino')({ prettyPrint: process.env.NODE_ENV !== "production" })

const client = jwksClient({
  cache: true,
  cacheMaxEntries: 1000,
  cacheMaxAge: ms('30d'),
  jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`
})

const options = {
  domain: process.env.AUTH0_DOMAIN,
  client_id: process.env.AUTH0_KEY,
}

function getKey(header, cb) {
  client.getSigningKey(header.kid, function (err, key) {
    var signingKey = key.publicKey || key.rsaPublicKey;
    cb(null, signingKey);
  })
}

async function verify(token) {
  return new Promise((resolve, reject) => {
    jwt.verify(token, getKey, options, (err, decoded) => {
      if (err) {
        return reject(new AuthenticationError('verify err statement'))
      }
      return resolve(decoded)
    })
  })
}

async function authenticate({ req, db }) {
  try {
    const token = (req.headers.authorization || "").slice(7)
    const data = await verify(token)
    const email = data[`${process.env.AUTH0_NAMESPACE}/email`].toLowerCase();
    const user = await db.users.findOne({ email: email })

    if (user) {
      // attaches .orgs to org admins
      if (user.organizations_admin) {
        user.orgs = await db.organizations.find({ _id: { $in: user.organizations_admin } }).toArray()
      }

      return user
    }

    // else create user
    const res = await db.users.insertOne({ email: email })
    const acctAndEntity = await createUserAccountAndEntity({ db, u: res.ops[0] })
    await updateAirtableUsers({ user: res.ops[0] })
    return res.ops[0]
  } catch (e) {
    // logger.error(e)
    console.log('authenicate ERROR', e)
    // throw new AuthenticationError('authenicate function catch statement')
  }
}

const updateAirtableUsers = async ({ user }) => {
  if (process.env.NODE_ENV === 'production') {
    await fetch('https://hooks.zapier.com/hooks/catch/7904699/onvqrx8/', {
      method: 'post',
      body: JSON.stringify({
        email: user.email,
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        _id: user._id || ''
      }),
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

module.exports = { verify, authenticate }
