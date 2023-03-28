import { Logger } from './utils/logger'
import inquirer from "inquirer";
import {Note} from "./models/note";
import {ObjectId} from "mongodb";
import {getAll, getNoteById, lockNote as lockNoteDb, unlockNote as unlockNoteDb} from "./db/mongo";
import {buildNoteStr, shareNote as shareNoteUtil, convertDateStringToAmerican} from "./utils/utils";
import {
    noteToShareQuestion,
    noteToLockQuestion,
    noteToUpdateQuestion,
    noteInfoQuestion,
    notePasswordQuestion,
    searchStrQuestion,
    noteToEditTagsQuestion,
    noteIdQuestion} from "./questions";
import { retryUnlock } from './noteOperations';

const logger = new Logger();

async function getNote(noteId: string): Promise<Note> {
    const note = await getNoteById(noteId);
    if (note) {
        return note as Note;
    }
    throw new Error('Note not found');
}

async function getNotesChoices(): Promise<Array<{name: string, value: ObjectId | string}>> {
    const notes = await getAll();
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
    const choices = await getNotesChoices();
    const questions = [{...noteIdQuestion, choices}];
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
    const [createdAt, title, text] = updatedNoteStr.split('\n\n');
    return {
        _id: noteId,
        title,
        text,	
        createdAt: new Date(convertDateStringToAmerican(createdAt).trim()).toISOString(),
        lastModified: new Date().toISOString(),
        tags: noteToUpdate.tags,
    }
}

export async function lockNote(): Promise<Note> {
    const choices = await getNotesChoices();
    const questions = [{...noteToLockQuestion, choices}];
    const {noteId} = await inquirer.prompt(questions);
    const noteToLock = await getNote(noteId);
    const {password} = await inquirer.prompt(notePasswordQuestion);
    return await lockNoteDb(noteToLock, password);
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

export async function editTags(): Promise<void> {
    const choices = await getNotesChoices();
    const questions = [{...noteToEditTagsQuestion, choices}];
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
    return await chooseTagsAction();
}

async function chooseTagsAction() {
    // const choices = await getTagsActionsChoices();
    // const questions = [{...chooseTagsActionsQuestion, choices}];
    // const {tagAction} = await inquirer.prompt(questions);
    // tag actions: [add, remove, edit]
}
