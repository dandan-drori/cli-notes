import { Logger } from './../utils/logger'
require('dotenv').config();
import { MongoClient, Collection } from "mongodb";

const logger = new Logger();

export class DbClient {
  static client: MongoClient;

  static async getCollection(collection: 'notes' | 'tags' | 'settings' | 'trash' = 'notes'): Promise<Collection> {
    if (!this.client) {
      this.client = new MongoClient(process.env.MONGO_URI as string);
      try {
        await this.client.connect();
      } catch (e) {
        logger.error(`Failed to connect to database:, ${e}`);
        process.exit(1);
      }
    }
    const collectionNames = {
      notes: process.env.NOTES_COL_NAME,
      tags: process.env.TAGS_COL_NAME,
      settings: process.env.SETTINGS_COL_NAME,
      trash: process.env.TRASH_COL_NAME,
    };
    const db = this.client.db(process.env.NOTES_DB_NAME as string);
    return db.collection(collectionNames[collection] as string);
  }
}