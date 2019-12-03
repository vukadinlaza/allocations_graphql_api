const cloudfrontSign = require('aws-cloudfront-sign')

const params = {
  keypairId: process.env.CLOUDFRONT_PUBLIC_KEY,
  privateKeyString: process.env.CLOUDFRONT_PRIVATE_KEY
}

const hour = 60 * 60 * 1000
function expiry () {
  return Date.now() + (4 * hour)
}

function getSignedUrl (path) {
  return cloudfrontSign.getSignedUrl(
    "d1n3j1zioee275.cloudfront.net" + path,
    {...params, expireTime: expiry()}
  )
}

module.exports = getSignedUrl

