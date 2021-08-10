const S3 = require("aws-sdk/clients/s3");
const Bucket = "allocations-public";
const url = `https://${Bucket}.s3.us-east-2.amazonaws.com`;
const s3 = new S3({ apiVersion: "2006-03-01" });

async function upload({ doc, path }) {
  const { createReadStream, filename } = await doc;
  const obj = {
    Bucket,
    Key: path,
    Body: createReadStream(),
    ContentType: "image/png",
  };
  await s3.upload(obj).promise();
}

module.exports = { upload };
