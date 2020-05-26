const AWS = require('aws-sdk')
const region = "us-east-2"
const cloudfrontSign = require('aws-cloudfront-sign')

const {
  CLOUDFRONT_URL,
  CLOUDFRONT_ENCRYPTED_URL,
  CLOUDFRONT_PUBLIC_KEY,
  CLOUDFRONT_SECRET_NAME,

} = process.env

const secretManager = new AWS.SecretsManager({
  region: region,
})

/** 

  Cloudfront signs s3 urls and serves to user with an expiry to
  increase security of the links

 **/
const hour = 60 * 60 * 1000
let cachedPrivateKey = null

function expiry () {
  return Date.now() + (4 * hour)
}

async function getSignedUrl (path) {
  const privateKeyString = cachedPrivateKey || await getPrivKey()

  // currently there are 2 cloudfronts, 1 for encrypted one for legacy w/ diff paths
  const baseURL = path.slice(0, 12) === "investments/" ? CLOUDFRONT_ENCRYPTED_URL : CLOUDFRONT_URL

  return cloudfrontSign.getSignedUrl(
    baseURL + "/" + path,
    { privateKeyString, keypairId: CLOUDFRONT_PUBLIC_KEY, expireTime: expiry() }
  )
}

async function getPrivKey () {
  const res = await secretManager.getSecretValue({
    SecretId: CLOUDFRONT_SECRET_NAME,
  }).promise()
  const key = res.SecretString
  cachedPrivateKey = key
  return key
}

module.exports = { getSignedUrl, getPrivKey }
