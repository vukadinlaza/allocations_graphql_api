/** 

  this is to migrate files from the non encrypted buckets to encrypted buckets

**/ 
require('dotenv').config()

const S3 = require('aws-sdk/clients/s3')
const s3 = new S3({apiVersion: '2006-03-01'})
const { MongoClient, ObjectId } = require("mongodb")
const { MONGO_URL } = process.env

async function migrate () {
  const Bucket = "allocations-investment-docs"

  const params = {}

  const { Contents } = await s3.listObjectsV2({ Bucket, Prefix: "5" }).promise()

  // copy over
  for (const obj of Contents) {
    await s3.copyObject({
      Bucket: "allocations-encrypted",
      CopySource: `/${Bucket}/${obj.Key}`,
      Key: `investments/${obj.Key}`
    }).promise()
  }
}

async function rewritePaths () {
  const client = new MongoClient(MONGO_URL, {
      useUnifiedTopology: true,
      useNewUrlParser: true,
  });

  const conn = await client.connect()
  const db = client.db("allocations-dashboard")

  const data = await db.collection("investments").find({ documents: { $ne: null }}).toArray()
  for (const investment of data) {
    const newDocs = investment.documents.map(d => {
      return d.slice(0, 12) === "investments/" ? d : `investments/${d}`
    })
    await db.collection("investments").updateOne(
      { _id: investment._id },
      { $set: { documents: newDocs } }
    )
  }
}