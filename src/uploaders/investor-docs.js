const S3 = require("aws-sdk/clients/s3");

const Bucket =
  process.env.NODE_ENV === "production"
    ? "allocations-encrypted"
    : process.env.AWS_S3_BUCKET;

const s3 = new S3({ apiVersion: "2006-03-01" });

/** Investor docs like kyc docs **/
async function putInvestorDoc(_id, doc, extension) {
  const { createReadStream } = doc;
  const Key = `investors/${_id}/${extension}`;
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

async function putInvestorProfileImage(_id, doc, filename) {
  const { createReadStream } = doc;
  const Key = `investors/${_id}/${filename}`;
  const obj = {
    Bucket: "allocations-user-img",
    Key,
    Body: createReadStream(),
    ContentType: doc.mimetype,
    ContentDisposition: "inline",
  };
  await s3.upload(obj).promise();

  return Key;
}

/** Investment Docs for individual investments **/
async function putInvestmentDoc(investment_id, doc) {
  const { createReadStream, filename } = doc;
  const Key = `investments/${investment_id}/${filename}`;

  const obj = {
    Bucket,
    Key,
    Body: createReadStream(),
    ContentType: "application/pdf",
    ContentDisposition: "inline",
  };
  await s3.upload(obj).promise();

  return Key;
}
async function putInvestmentCapitalAccount(
  investment_id,
  buffer,
  timestamp,
  templateName
) {
  const Key =
    `investments/${investment_id}/${timestamp}-${templateName}.pdf`.replace(
      /\s/g,
      "_"
    );

  const obj = {
    Bucket,
    Key,
    Body: Buffer.from(buffer),
    ContentType: "application/pdf",
    ContentDisposition: "inline",
  };
  await s3.upload(obj).promise();

  return Key;
}

function rmInvestmentDoc(investment_id, filename) {
  return s3
    .deleteObject({ Bucket, Key: `investments/${investment_id}/${filename}` })
    .promise();
}

module.exports = {
  putInvestmentDoc,
  rmInvestmentDoc,
  putInvestorDoc,
  putInvestorProfileImage,
  putInvestmentCapitalAccount,
};
