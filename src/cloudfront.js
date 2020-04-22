const S3 = require('aws-sdk/clients/s3')
const cloudfrontSign = require('aws-cloudfront-sign')

const { CLOUDFRONT_URL, CLOUDFRONT_ENCRYPTED_URL, CLOUDFRONT_PUBLIC_KEY, CLOUDFRONT_PRIVATE_KEY } = process.env

const s3 = new S3({apiVersion: '2006-03-01'})

const hour = 60 * 60 * 1000
function expiry () {
  return Date.now() + (4 * hour)
}

let cachedPrivateKey = null
async function getSignedUrl (path) {
  const privateKeyString = cachedPrivateKey || await getPrivKey()

  // currently there are 2 cloudfronts, 1 for encrypted one for legacy w/ diff paths
  const baseURL = path.slice(0, 12) === "investments/" ? CLOUDFRONT_ENCRYPTED_URL : CLOUDFRONT_URL 

  return cloudfrontSign.getSignedUrl(
    baseURL + "/" + path,
    {privateKeyString, keypairId: CLOUDFRONT_PUBLIC_KEY, expireTime: expiry()}
  )
}

async function getPrivKey () {
  const res = await s3.getObject({ Bucket: 'allocations-credentials', Key: "cloudfront-private-key.pem"}).promise()
  const key = res.Body.toString()
  cachedPrivateKey = key
  return key
}

module.exports = { getSignedUrl }

