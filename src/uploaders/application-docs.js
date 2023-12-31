const S3 = require("aws-sdk/clients/s3");
const Bucket = "allocations-deal-applications-test";
const s3 = new S3({ apiVersion: "2006-03-01" });

/**
 * Pitch documents from deal application
 */
async function uploadPitchDoc(userId, doc, docType) {
  const { createReadStream, filename } = doc;
  const Key = `${userId}/${docType}-${filename}`;
  const obj = {
    Bucket,
    Key,
    Body: createReadStream(),
    ContentType: doc.mimetype,
    ContentDisposition: "inline",
  };
  await s3.upload(obj).promise();

  return Key;
}

module.exports = { uploadPitchDoc };
