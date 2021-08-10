require("dotenv").config();
const { getSignedUrl } = require("../src/cloudfront");

test("cloudfront signs correctly", async () => {
  const url = await getSignedUrl("/5de7df4441d111dcc8de83ef/test.pdf");
  expect(url);
});
