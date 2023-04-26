import { ObjectId } from 'mongodb';
import { Tag } from '../models/tag';
import { getCollection } from './db';

export async function getAllTags(): Promise<Tag[]> {
	const col = await getCollection('tags');
	const result = await col.find({}).toArray();
	if (result) {
		return result as Tag[];
	}
	throw new Error('Failed to retrieve tags');
}

export async function getTagById(id: string): Promise<Tag> {
	const col = await getCollection('tags');
	const tag = await col.findOne({ _id: new ObjectId(id) });
	if (tag) {
		return tag as Tag;
	}
	throw new Error('Failed to retrieve tag');
}

export async function getTagByName(tagName: string): Promise<Tag> {
	const col = await getCollection('tags');
	const tag = await col.findOne({ text: tagName });
	if (tag) {
		return tag as Tag;
	}
	throw new Error('Failed to retrieve tag');
}

async function insertOne(tag: Tag) {
	const col = await getCollection('tags');
	return col.insertOne(tag);
}

async function update(tag: Tag): Promise<Tag> {
	const col = await getCollection('tags');
	const result = await col.findOneAndUpdate({ _id: new ObjectId(tag._id) }, { $set: tag });
	if (result.value) {
		return result.value as Tag;
	}
	throw new Error('Tag not found');
}

export async function saveTag(tag: Tag) {
	if (tag._id) {
		return update(tag);
	}
	return insertOne(tag);
}

export async function removeTag(tagId: string) {
    const col = await getCollection('tags');
    return col.findOneAndDelete({_id: new ObjectId(tagId)});
}