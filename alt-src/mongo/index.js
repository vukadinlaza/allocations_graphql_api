const { MongoClient } = require("mongodb")
const { MONGO_URL, MONGO_DB } = process.env

async function connect() {
    const client = new MongoClient(MONGO_URL, {
        useUnifiedTopology: true,
        useNewUrlParser: true,
    });

    const conn = await client.connect()
    console.log("🔗 Connected to Mongo")
    return conn.db(MONGO_DB)
}

module.exports = { connect }