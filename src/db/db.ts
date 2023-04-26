import { Logger } from './../utils/logger'
require('dotenv').config();
import { MongoClient, Collection } from "mongodb";

const logger = new Logger();

const client = new MongoClient(process.env.MONGO_URI as string);

async function getCollection(collection: 'notes' | 'tags' | 'settings' = 'notes'): Promise<Collection> {
  const collectionNames = {
    notes: process.env.NOTES_COL_NAME,
    tags: process.env.TAGS_COL_NAME,
    settings: process.env.SETTINGS_COL_NAME,
  };
  try {
    await client.connect();
    const db = client.db(process.env.NOTES_DB_NAME as string);
    return db.collection(collectionNames[collection] as string);
  } catch (e) {
    logger.error(`Failed to connect to mongodb:, ${e}`);
    process.exit(1);
  }
}

export {
  getCollection,
}
