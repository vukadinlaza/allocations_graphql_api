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
let client = new MongoClient(MONGO_URL, {
  useUnifiedTopology: true,
  useNewUrlParser: true,
});

// eslint-disable-next-line no-console
client.on("open", () => console.log("🔗 Connected to Mongo"));

/** connects and attaches name of cols to db **/
async function connect({ dbName = MONGO_DB } = {}) {
  const conn = await client.connect();
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
  if (client.isConnected()) await client.close();
};

async function drop(db) {
  // THIS SHOULD ONLY HAPPEN IN TEST
  if (NODE_ENV === "test" && MONGO_URL === global.__MONGO_URI__) {
    await Promise.all(cols.map((col) => db[col].deleteMany()));
  }
}

module.exports = { connect, drop, getDB, endDBConnection };
