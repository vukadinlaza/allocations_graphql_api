const { MongoClient } = require("mongodb")
const { MONGO_URL, MONGO_DB, NODE_ENV } = process.env

const cols = ["investments", "deals", "organizations", "users", "orders", "trades", "matchrequests", "compliancetasks", 'accounts', 'entities', 'signingpackets', 'comments', 'applications']

/** connects and attaches name of cols to db **/
async function connect() {
    const client = new MongoClient(MONGO_URL, {
        useUnifiedTopology: true,
        useNewUrlParser: true,
    })

    const conn = await client.connect()
    console.log("🔗 Connected to Mongo")
    const db = conn.db(MONGO_DB)

    // attach collections directly to db
    cols.forEach(col => {
        db[col] = db.collection(col)
    })

    return db
}

async function drop(db) {
    // THIS SHOULD ONLY HAPPEN IN TEST
    if (NODE_ENV === "test" && MONGO_URL === "mongodb://localhost:27017") {
        await Promise.all(cols.map(col => db[col].deleteMany()))
    }
}

module.exports = { connect, drop }
