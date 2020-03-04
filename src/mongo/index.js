const { MongoClient } = require("mongodb")
const { MONGO_URL, MONGO_DB } = process.env

const cols = ["investments", "deals", "organizations", "users", "orders", "trades"]

async function connect() {
    const client = new MongoClient(MONGO_URL, {
        useUnifiedTopology: true,
        useNewUrlParser: true,
    });

    const conn = await client.connect()
    console.log("🔗 Connected to Mongo")
    const db = conn.db(MONGO_DB)

    // attach collections directly to db
    cols.forEach(col => {
      db[col] = db.collection(col)
    })
    return db
}

module.exports = { connect }