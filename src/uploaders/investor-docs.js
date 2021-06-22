const S3 = require('aws-sdk/clients/s3')

const Bucket = process.env.NODE_ENV === "production" ? "allocations-encrypted" : process.env.AWS_S3_BUCKET
const url = `https://${Bucket}.s3.us-east-2.amazonaws.com`

const s3 = new S3({ apiVersion: '2006-03-01' })

/** Investor docs like kyc docs **/
async function putInvestorDoc(_id, doc, extension) {
  const { createReadStream, filename } = doc
  const Key = `investors/${_id}/${extension}`
  const obj = {
    Bucket,
    Key,
    Body: createReadStream(),
    ContentType: doc.mimetype,
    ContentDisposition: "inline"
  }
  await s3.upload(obj).promise()

  return Key
}

/** Investment Docs for individual investments **/
async function putInvestmentDoc(investment_id, doc, isK1) {
  const { createReadStream, filename } = doc
  const Key = `investments/${investment_id}/${filename}`

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

function rmInvestmentDoc(investment_id, filename) {
  return s3.deleteObject({ Bucket, Key: `investments/${investment_id}/${filename}` }).promise()
}

module.exports = { putInvestmentDoc, rmInvestmentDoc, putInvestorDoc }
