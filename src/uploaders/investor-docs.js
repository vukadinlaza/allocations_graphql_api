const S3 = require('aws-sdk/clients/s3')

const Bucket = process.env.NODE_ENV === "production" ? "allocations-encrypted" : "allocations-encrypted-test"
const url = `https://${Bucket}.s3.us-east-2.amazonaws.com`

const s3 = new S3({apiVersion: '2006-03-01'})

async function putUserFile (user, file) {
  const Key = "test1.pdf"

  const obj = {Bucket, Key, Body: file}
  await s3.putObject(obj).promise()

  return `https://${Bucket}.s3.us-east-2.amazonaws.com/${Key}`
}

function rmInvestmentDoc (investment_id, filename) {
  return s3.deleteObject({ Bucket, Key: `investments/${investment_id}/${filename}` }).promise()
}

async function putInvestorDoc (_id, doc, extension) {
  const {createReadStream, filename} = doc
  const Key = `investors/${_id}/${extension}`

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

async function putInvestmentDoc (investment_id, doc) {
  const {createReadStream, filename} = doc
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

module.exports = { putUserFile, putInvestmentDoc, rmInvestmentDoc, putInvestorDoc }