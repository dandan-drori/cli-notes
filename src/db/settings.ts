import { ObjectId } from "mongodb";
import { getCollection } from "./db";
import { Settings } from "../models/settings";
import { getDefaultSettings } from "../utils/utils";

export async function getSettings(): Promise<Settings> {
    const col = await getCollection('settings');
	const settings = await col.findOne({});
	if (settings) {
		return settings as Settings;
	}
	return getDefaultSettings();
}

export async function updateSettings(settings: Settings) {
    const col = await getCollection('settings');
	const settingsToSave = {
		_id: new ObjectId(settings._id),
		...settings
	}
	const result = await col.findOneAndUpdate({ _id: settingsToSave._id }, { $set: settingsToSave });
	if (result.value) {
		return result.value as Settings;
	}
	throw new Error('Failed to update settings');
}

export async function setSettings() {
	const col = await getCollection('settings');
	await col.insertOne({sortBy: 'createdAt', sortDirection: 'desc'});
}