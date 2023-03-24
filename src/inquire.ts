import inquirer from "inquirer";
import {searchStr as searchStrQuestion} from "./questions/searchStr";
import {Note} from "./models/note";
import {noteInfo} from "./questions/noteInfo";
import {ObjectId} from "mongodb";
import {getAll, getNoteById, lockNote as lockNoteDb, unlockNote as unlockNoteDb} from "./db/mongo";
import {noteId as noteIdQuestion} from "./questions/noteId";
import {noteToUpdate as noteToUpdateQuestion} from "./questions/noteToUpdate";
import {buildNoteStr, convertDateStringToAmerican} from "./utils/utils";
import {notePassword} from "./questions/notePassword";
import {noteToLock as noteToLockQuestion} from "./questions/noteToLock";
import {noteToUnlock as noteToUnlockQuestion} from "./questions/noteToUnlock";
import {retryUnlock} from "./index";

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
    const {title, text} = await inquirer.prompt(noteInfo);
    const createdAt = new Date().toISOString();
    return {title, text, createdAt};
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
        createdAt: new Date(convertDateStringToAmerican(createdAt).trim()).toISOString()
    }
}

export async function lockNote(): Promise<Note> {
    const choices = await getNotesChoices();
    const questions = [{...noteToLockQuestion, choices}];
    const {noteId} = await inquirer.prompt(questions);
    const noteToLock = await getNote(noteId);
    const {password} = await inquirer.prompt(notePassword);
    return await lockNoteDb(noteToLock, password);
}

export async function unlockNotesPrompt(lockedNotes: Note[]): Promise<Array<Note | boolean>> {
    const choices = lockedNotes.map(({title, _id}: Partial<Note>) => ({name: title as string, value: _id as ObjectId}));
    const questions = [{...noteToUnlockQuestion, choices}];
    const {noteId} = await inquirer.prompt(questions);
    const noteToUnlock = lockedNotes.find((note: Note) => note._id === noteId);
    if (!noteToUnlock) return [null as never as Note, false];
    const {password} = await inquirer.prompt(notePassword);
    const isNoteUnlocked = await unlockNoteDb(noteToUnlock, password);
    return [noteToUnlock, !!isNoteUnlocked];
}
