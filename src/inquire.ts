import { Logger } from './utils/logger'
import inquirer from "inquirer";
import {Note} from "./models/note";
import type { ObjectId } from "mongodb";
import {getAll, getNoteById, lockNote as lockNoteDb, save, unlockNote as unlockNoteDb, moveNoteToTrash as moveNoteToTrashDb, remove, restoreNoteFromTrash as restoreNoteFromTrashDb, emptyTrash as emptyTrashDb, getNotesInTrash as getNotesInTrashDb} from "./db/mongo";
import {buildNoteStr, shareNote as shareNoteUtil, convertDateStringToAmerican, unlockNoteWithRetry, printNoteList} from "./utils/utils";
import {
    noteToShareQuestion,
    noteToLockQuestion,
    noteToUpdateQuestion,
    noteInfoQuestion,
    notePasswordQuestion,
    searchStrQuestion,
    noteIdQuestion} from "./questions";
import { retryUnlock } from './noteOperations';
import { tagActionQuestion, TagActions } from './questions/tags/actions';
import { addTag, editTag, listTags, removeTag, getTagsChoices } from './tagOperations';
import { tagIdQuestion } from './questions/tags';
import { TrashActions, trashActionQuestion } from './questions/trash/action';

const logger = new Logger();

async function getNote(noteId: string): Promise<Note> {
    const note = await getNoteById(noteId);
    if (note) {
        return note as Note;
    }
    throw new Error('Note not found');
}

async function getNotesChoices(isTrash = false): Promise<Array<{name: string, value: ObjectId | string}>> {
    const notes = await getAll(isTrash);
    return notes.map(({title, _id}: Partial<Note>) => ({name: title as string, value: _id as ObjectId}));
}

export async function getSearchStr(): Promise<string> {
    const {searchStr} = await inquirer.prompt(searchStrQuestion);
    return searchStr;
}

export async function getNoteInfo(): Promise<Note> {
    const {title, text} = await inquirer.prompt(noteInfoQuestion);
    const createdAt = new Date().toISOString();
    const lastModified = createdAt;
    const tags: string[] = [];
    return {title, text, createdAt, lastModified, tags};
}

export async function getNoteId(): Promise<string> {
    const choices = await getNotesChoices(true);
    const message = 'Which note would you like to permanently delete?';
    const questions = [{...noteIdQuestion, message, choices}];
    const {noteId} = await inquirer.prompt(questions);
    return noteId;
}

export async function getUpdatedNote(): Promise<Note> {
    const choices = await getNotesChoices();
    const questions = [{...noteToUpdateQuestion, choices}];
    const {noteId} = await inquirer.prompt(questions);
    const noteToUpdate = await getNote(noteId);

    if (noteToUpdate.password) {
        let isUnlocked = await retryUnlock([noteToUpdate]);
        while (!isUnlocked) {
            isUnlocked = await retryUnlock([noteToUpdate])
        }
    }

    const noteStr = buildNoteStr(noteToUpdate);

    const {updatedNoteStr} = await inquirer.prompt([
        {
            type: "editor",
            name: "updatedNoteStr",
            message: "edit a note",
            default: noteStr
        },
    ]);
    const splittedNote = updatedNoteStr.split('\n\n');
    const [createdAt, title] = splittedNote;
    const restOfNote = splittedNote.slice(2);
    const text = typeof restOfNote === 'string' ? restOfNote : restOfNote.join('\n\n');
    return {
        ...noteToUpdate,
        title,
        text,	
        createdAt: new Date(convertDateStringToAmerican(createdAt).trim()).toISOString(),
        lastModified: new Date().toISOString(),
    }
}

export async function lockNote(mainPassword: string): Promise<Note> {
    const choices = await getNotesChoices();
    const questions = [{...noteToLockQuestion, choices}];
    const {noteId} = await inquirer.prompt(questions);
    const noteToLock = await getNote(noteId);
    let newPassword = '';
    if (!mainPassword) {
        const { password } = await inquirer.prompt(notePasswordQuestion);
        newPassword = password;
    }
    return await lockNoteDb(noteToLock, newPassword, mainPassword);
}

export async function shareNote(): Promise<String> {
    const choices = await getNotesChoices();
    const questions = [{...noteToShareQuestion, choices}];
    const {noteId} = await inquirer.prompt(questions);
    const noteToShare = await getNote(noteId);
    if (noteToShare.password) {
        const {password} = await inquirer.prompt(notePasswordQuestion);
        const isNoteUnlocked = await unlockNoteDb(noteToShare, password);
        if (!!isNoteUnlocked) return await shareNoteUtil(noteToShare);
        return '';
    }
    return await shareNoteUtil(noteToShare);
}

export async function manageTags(): Promise<boolean> {
    const { tagAction } = await inquirer.prompt(tagActionQuestion);
    const tagActionFunctions = {
        [TagActions.list]: listTags,
        [TagActions.add]: addTag,
        [TagActions.remove]: removeTag,
        [TagActions.edit]: editTag,
        [TagActions.apply]: applyTagsToNote,
        [TagActions.back]: async () => true,
    }
    return await tagActionFunctions[tagAction as TagActions]();
}

async function applyTagsToNote(): Promise<boolean> {
    try {
        const noteToEditTags = await getUnlockedNote();
        const tagId = await getChosenTagId();
        const tags = [...noteToEditTags.tags, tagId];
        await save({...noteToEditTags, tags});
        logger.success('Tag added to note successfully');
    } catch(err) {
        logger.error(`Failed to add tag to note | ${err}`);
    }
    return false;
}

async function getUnlockedNote(): Promise<Note> {
    const choices = await getNotesChoices();
        const message = 'Which note would you like to add a tag to?';
        const questions = [{...noteIdQuestion, message, choices}];
        const {noteId} = await inquirer.prompt(questions);
        const noteToEditTags = await getNote(noteId);
        if (noteToEditTags.password) {
            const {password} = await inquirer.prompt(notePasswordQuestion);
            let isNoteUnlocked = await unlockNoteDb(noteToEditTags, password);
            while (!isNoteUnlocked) {
                logger.error('Incorrect password');
                isNoteUnlocked = await unlockNoteDb(noteToEditTags, password);
            }
        }
        return noteToEditTags;
}

async function getChosenTagId(): Promise<string> {
    const tagsChoices = await getTagsChoices();
    const tagsMessage = 'Which tag would you add to the note?';
    const { tagId } = await inquirer.prompt([{...tagIdQuestion, message: tagsMessage, choices: tagsChoices}]);
    return tagId.toString();
}

export async function manageTrash(): Promise<boolean> {
    const { trashAction } = await inquirer.prompt(trashActionQuestion);
    const trashActionFunctions = {
        [TrashActions.list]: listNotesInTrash,
        [TrashActions.delete]: removeNoteFromTrash,
        [TrashActions.restore]: restoreNoteFromTrash,
        [TrashActions.empty]: emptyTrash,
        [TrashActions.back]: async () => true,
    }
    return await trashActionFunctions[trashAction as TrashActions]();
}

export async function moveNoteToTrash(): Promise<Note> {
    const choices = await getNotesChoices();
    const { noteId } = await inquirer.prompt([{...noteIdQuestion, choices}]);
    const note = await getNoteById(noteId);
	await unlockNoteWithRetry(note);

    note.deletedAt = Date.now();
    return await moveNoteToTrashDb(note);
}

async function listNotesInTrash(): Promise<boolean> {
	try {
		const notes = await getNotesInTrashDb();
        if (!notes.length) {
            logger.info('\nThe trash is empty\n');
            return false;
        }
		logger.info('\n  - - - - - 1 - - - - -');
		const lockedNotes = await printNoteList((notes as Note[]));
		if (!lockedNotes.length) return false;
		let isNoteUnlocked = await retryUnlock(lockedNotes);
		while (!isNoteUnlocked) {
			logger.error('Incorrect password');
			isNoteUnlocked = await retryUnlock(lockedNotes);
		}
	} catch (e) {
		logger.error(`Failed to fetch notes: ${e}`);
	}
    return false;
}

async function restoreNoteFromTrash(): Promise<boolean> {
    try {
        const choices = await getNotesChoices(true);
        if (!choices.length) {
            logger.info('\nThe trash is empty\n');
            return false;
        }
        const message = 'Which note would you like restore?';
        const { noteId } = await inquirer.prompt([{...noteIdQuestion, message, choices}]);
        const note = await getNoteById(noteId, true);
        note.deletedAt = undefined;
        await restoreNoteFromTrashDb(note);
		logger.success('Note restored successfully');
    } catch (e) {
		logger.error(`Failed to restore note: ${e}`);
    }
    return false;
}

async function removeNoteFromTrash(): Promise<boolean> {
	try {
		const id = await getNoteId();
		const note = await getNoteById(id, true);
		await unlockNoteWithRetry(note);
		await remove(id);
		logger.success('Note deleted successfully');
	} catch (e) {
		logger.error(`Failed to delete note: ${e}`);
	}
    return false;
}

async function emptyTrash(): Promise<boolean> {
    try {
        await emptyTrashDb();
		logger.success('Trash emptied successfully');
    } catch (e) {
		logger.error(`Failed to empty trash: ${e}`);
    }
    return false;
}