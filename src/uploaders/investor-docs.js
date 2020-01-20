const S3 = require('aws-sdk/clients/s3')

const Bucket = process.env.S3_INVESTMENT_DOCS_BUCKET || "allocations-investor-docs-test"
const url = `https://${Bucket}.s3.us-east-2.amazonaws.com`

const s3 = new S3({apiVersion: '2006-03-01'})

async function putUserFile (user, file) {
  const Key = "test1.pdf"

  const obj = {Bucket, Key, Body: file}
  await s3.putObject(obj).promise()

  return `https://${Bucket}.s3.us-east-2.amazonaws.com/${Key}`
}

function rmInvestmentDoc (investment_id, filename) {
  return s3.deleteObject({ Bucket, Key: `${investment_id}/${filename}` }).promise()
}

async function putInvestorDoc (_id, doc) {
  const {createReadStream, filename} = doc

  const obj = {
    Bucket, 
    Key: `investors/${_id}/passport`, 
    Body: createReadStream(),
    ContentType: "application/pdf",
    ContentDisposition: "inline"
  }
  await s3.upload(obj).promise()

  return `investors/${_id}/passport`
}

async function putInvestmentDoc (investment_id, doc) {
  const {createReadStream, filename} = doc

  const obj = {
    Bucket, 
    Key: `${investment_id}/${filename}`, 
    Body: createReadStream(),
    ContentType: "application/pdf",
    ContentDisposition: "inline"
  }
  await s3.upload(obj).promise()

  return `${investment_id}/${filename}`
}

module.exports = { putUserFile, putInvestmentDoc, rmInvestmentDoc, putInvestorDoc }