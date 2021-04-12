const S3 = require('aws-sdk/clients/s3')

const Bucket = "allocations-investment-docs"
const url = `https://${Bucket}.s3.us-east-2.amazonaws.com`

const s3 = new S3({ apiVersion: '2006-03-01' })

const path = process.env.NODE_ENV === "production" ? "deals" : "deals-test"

async function addDoc({ doc, title, deal_id }) {
  const { createReadStream, filename } = await doc
  const Key = `${path}/${deal_id}/${title || filename.replace(' ', '')}`
  const obj = {
    Bucket,
    Key,
    Body: createReadStream(),
    ContentType: "application/pdf",
    ContentDisposition: "inline"
  }
  await s3.upload(obj).promise()
  return Key
}

async function rmDoc({ title, deal_id }) {
  const Key = `${path}/${deal_id}/${title}`
  await s3.deleteObject({ Bucket, Key }).promise()
  return Key
}


async function uploadImage({ logo, title, deal_id }) {
  // Read content from the file
  const { createReadStream, filename } = await logo
  const Key = `deals/${deal_id}/${title || filename.replace(' ', '')}`
  const obj = {
    Bucket: 'allocations-public',
    Key,
    Body: createReadStream(),
    ContentDisposition: "inline"
  }
  await s3.upload(obj).promise()
  return Key
};

module.exports = { addDoc, rmDoc, uploadImage }