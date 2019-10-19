import { Db, MongoClient } from "mongodb";


export class MongoConnnection {
    private url: string;

    constructor(mongoUrl: string) {
        this.url = mongoUrl;
    }

    public getDb() {
        return new Promise<Db>((resolve, reject) => {
            const client = new MongoClient(this.url, {
                useUnifiedTopology: true,
                useNewUrlParser: true,
            });
            client.connect()
                .then((db) => {
                    resolve(db.db("allocations"));
                })
                .catch((err) => reject(err));
        });
    }
}



















