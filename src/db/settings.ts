import { ObjectId } from "mongodb";
import { getCollection } from "./db";
import { Settings } from "../models/settings";

export async function updateSettings(settings: Settings) {
    const col = await getCollection('settings');
	const result = await col.findOneAndUpdate({ _id: new ObjectId(settings._id) }, { $set: settings });
	if (result.value) {
		return result.value as Settings;
	}
	throw new Error('Unable to update settings');
}