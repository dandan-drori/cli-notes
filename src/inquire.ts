import inquirer from "inquirer";
import {searchStr as searchStrQuestion} from "./questions/searchStr";
import {Note} from "./models/note";
import {noteInfo} from "./questions/noteInfo";
import {ObjectId} from "mongodb";
import {getAll, getNoteById, lockNote as lockNoteDb} from "./db/mongo";
import {noteId as noteIdQuestion} from "./questions/noteId";
import {noteToUpdate as noteToUpdateQuestion} from "./questions/noteToUpdate";
import {buildNoteStr} from "./utils/utils";
import {notePassword} from "./questions/notePassword";
import {noteToLock as noteToLockQuestion} from "./questions/noteToLock";
import {seeNotes} from "./questions/seeNotes";

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
        createdAt: new Date(createdAt.trim()).toISOString()
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

export async function lockedNotesPrompt(): Promise<string> {
    const {seeNotes} = await inquirer.prompt(seeNotes);
    if (!seeNotes) process.exit(1);
    // todo prompt for password
    // const {password} = await inquirer.prompt(promptPassword);
    // return password;
}