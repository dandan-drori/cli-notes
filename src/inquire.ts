import inquirer from "inquirer";
import {Note} from "./models/note";
import {ObjectId} from "mongodb";
import {getAll, getNoteById, lockNote as lockNoteDb, unlockNote as unlockNoteDb} from "./db/mongo";
import {buildNoteStr, shareNote as shareNoteUtil} from "./utils/utils";
import {
    noteToShareQuestion,
    noteToLockQuestion,
    passwordPromptQuestion,
    noteToUpdateQuestion,
    noteToUnlockQuestion,
    noteInfoQuestion,
    notePasswordQuestion,
    searchStrQuestion,
    noteIdQuestion} from "./questions";

async function getNote(noteId: string): Promise<Note> {
    return await getNoteById(noteId) as never as Promise<Note>;
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
    return {title, text, createdAt, lastModified};
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
    const noteStr = buildNoteStr(noteToUpdate);

    const {updatedNoteStr} = await inquirer.prompt([
        {
            type: "editor",
            name: "updatedNoteStr",
            message: "edit a note",
            default: noteStr
        },
    ]);
    const [lastModified, title, text] = updatedNoteStr.split('\n\n');
    return {
        _id: noteId,
        title,
        text,
        createdAt: noteToUpdate.createdAt,
        lastModified: new Date().toISOString(),
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

export async function unlockNotesPrompt(lockedNotes: Note[]): Promise<Array<Note | boolean>> {
    const choices = lockedNotes.map(({title, _id}: Partial<Note>) => ({name: title as string, value: _id as ObjectId}));
    const questions = [{...noteToUnlockQuestion, choices}];
    const {noteId} = await inquirer.prompt(questions);
    const noteToUnlock = lockedNotes.find((note: Note) => note._id === noteId);
    if (!noteToUnlock) return [null as never as Note, false];
    const {password} = await inquirer.prompt(notePasswordQuestion);
    const isNoteUnlocked = await unlockNoteDb(noteToUnlock, password);
    return [noteToUnlock, !!isNoteUnlocked];
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