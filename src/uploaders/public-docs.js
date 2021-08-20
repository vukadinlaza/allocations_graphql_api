const S3 = require("aws-sdk/clients/s3");
const Bucket = "allocations-public";
const s3 = new S3({ apiVersion: "2006-03-01" });

async function upload({ doc, path }) {
  const { createReadStream } = await doc;
  const obj = {
    Bucket,
    Key: path,
    Body: createReadStream(),
    ContentType: "image/png",
  };
  await s3.upload(obj).promise();
}

module.exports = { upload };
