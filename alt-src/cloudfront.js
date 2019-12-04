const cloudfrontSign = require('aws-cloudfront-sign')

const { CLOUDFRONT_URL, CLOUDFRONT_PUBLIC_KEY, CLOUDFRONT_PRIVATE_KEY } = process.env

const params = {
  keypairId: CLOUDFRONT_PUBLIC_KEY,
  privateKeyString: CLOUDFRONT_PRIVATE_KEY
}

const hour = 60 * 60 * 1000
function expiry () {
  return Date.now() + (4 * hour)
}

function getSignedUrl (path) {
  return cloudfrontSign.getSignedUrl(
    CLOUDFRONT_URL + "/" + path,
    {...params, expireTime: expiry()}
  )
}

module.exports = { getSignedUrl }

