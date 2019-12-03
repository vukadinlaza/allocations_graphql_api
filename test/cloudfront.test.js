const getSignedUrl = require('../alt-src/cloudfront')

test("cloudfront signs correctly", () => {
  const url = getSignedUrl("/test.pdf")
  expect(url)
})