import { Db, MongoClient } from "mongodb";

export async function connect() {
    const URL = process.env.MONGO_URL || "mongodb://localhost:27017/allocations";

    const client = new MongoClient(URL, {
        useUnifiedTopology: true,
        useNewUrlParser: true,
    });

    const conn = await client.connect()
    console.log("🔗 Connected to Mongo")
    return conn.db("allocations")
}