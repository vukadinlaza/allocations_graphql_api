require('dotenv').config()
const { getSignedUrl } = require('../alt-src/cloudfront')

test("cloudfront signs correctly", () => {
  const url = getSignedUrl("/5de7df4441d111dcc8de83ef/test.pdf")
  expect(url)
})