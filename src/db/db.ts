require('dotenv').config();
import { MongoClient } from "mongodb";

const client = new MongoClient(process.env.MONGO_URI as string);

async function getDb() {
  try {
    await client.connect();
    return await client.db(process.env.NOTES_DB_NAME as string);
  } catch (e) {
    console.log('Error: failed to connect to mongodb:', e);
    process.exit(1);
  }
}

export {
  getDb,
}
