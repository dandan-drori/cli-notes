import inquirer from 'inquirer';
import { Logger } from './utils/logger';
import { getAllTags, saveTag, removeTag as removeTagDb, getTagById, getTagByName as getTagByNameDb } from "./db/tags";
import { Tag } from './models/tag';
import { tagIdQuestion, tagNameQuestion } from './questions/tags';
import { ObjectId } from 'mongodb';
import { Note } from './models/note';

const logger = new Logger();

export async function listTags(): Promise<void> {
    const tags = await getAllTags();
    const tagsNames = tags.map(({text}: Tag) => `#${text}`);
    logger.info(`\n${tagsNames.join(', ')}\n`);
}

export async function addTag(): Promise<Tag> {
    const tag = await getNewTag();
    try {
        await saveTag(tag);
        logger.success('New tag created successfully');
    } catch (err) {
        logger.error(`Failed to create new tag | ${err}`);
    }
    
    return tag;
}

async function getNewTag(): Promise<Tag> {
    const { tagName } = await inquirer.prompt(tagNameQuestion);
    return {
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        text: tagName,
        notes: [],
    };
}

export async function removeTag() {
    const choices = await getTagsChoices();
    const { tagId } = await inquirer.prompt([{...tagIdQuestion, choices}]);
    try {
        await removeTagDb(tagId.toString());
        logger.success('Tag deleted successfully');
    } catch(err) {
        logger.error(`Failed to delete tag | ${err}`);
    }
}

export async function editTag() {
    const choices = await getTagsChoices();
    const message = 'Which tag would you like to update?';
    const { tagId } = await inquirer.prompt([{...tagIdQuestion, message, choices}]);
    const nameMessage = "New tag's name?";
    const { tagName } = await inquirer.prompt([{...tagNameQuestion, message: nameMessage, choices}]);
    try {
        const tag = await getTagById(tagId.toString());
        await saveTag({ ...tag, text: tagName });
        logger.success('Tag updated successfully');
    } catch(err) {
        logger.error(`Failed to update tag | ${err}`);
    }
}

export async function getTagsChoices(): Promise<Array<{name: string, value: ObjectId | string}>> {
    const tags = await getAllTags();
    return tags.map(({text, _id}: Partial<Tag>) => ({name: text as string, value: _id as ObjectId}));
}

export async function getTag(): Promise<Tag> {
    const choices = await getTagsChoices();
    const message = 'Which tag would you like to filter by?';
    const { tagId } = await inquirer.prompt([{...tagIdQuestion, message, choices}]);
    try {
        return await getTagById(tagId.toString());
    } catch(err) {
        logger.error(`Failed to filter by tag | ${err}`);
    }
    return {} as Tag;
}

export async function getTagByName(tagName: string): Promise<Tag> {
    return await getTagByNameDb(tagName);
}

export async function getNotesWithTag(notes: Note[], tag: Tag): Promise<Note[]> {
    const newTagId = (tag._id as object).toString();
	return notes.filter((note: Note) => {
        return note.tags.find((tagId: string) => {
            return (tagId as string).toString() === newTagId;
		})
	});
}