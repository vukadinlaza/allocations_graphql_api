const { MongoClient } = require("mongodb");
const { MONGO_URL, MONGO_DB, NODE_ENV } = process.env;

const cols = [
  "investments",
  "deals",
  "organizations",
  "users",
  "accounts",
  "entities",
  "signingpackets",
  "comments",
  "applications",
  "dealOnboarding",
];

let db = null;
let client = null;
/** connects and attaches name of cols to db **/
async function connect({ url = MONGO_URL, dbName = MONGO_DB } = {}) {
  client = new MongoClient(url, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
  });

  const conn = await client.connect();
  console.log("🔗 Connected to Mongo");
  db = conn.db(dbName);

  // attach collections directly to db
  cols.forEach((col) => {
    db[col] = db.collection(col);
  });

  return db;
}

const getDB = async () => {
  if (!db) await connect();
  return db;
};

const endDBConnection = async () => {
  if (client) await client.end();
};

async function drop(db) {
  // THIS SHOULD ONLY HAPPEN IN TEST
  if (NODE_ENV === "test" && MONGO_URL === global.__MONGO_URI__) {
    await Promise.all(cols.map((col) => db[col].deleteMany()));
  }
}

module.exports = { connect, drop, getDB, endDBConnection };
