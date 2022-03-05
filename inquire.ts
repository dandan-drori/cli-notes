import inquirer from "inquirer";
import {searchStr as searchStrQuestion} from "./questions/searchStr";
import {Note} from "./models/note";
import {noteInfo} from "./questions/noteInfo";
import {ObjectId} from "mongodb";
import {getAll, getNoteById} from "./db/mongo";
import {noteId as noteIdQuestion} from "./questions/noteId";
import {noteToUpdate as noteToUpdateQuestion} from "./questions/noteToUpdate";
import {buildNoteStr} from "./utils/utils";

async function getNote(noteId: string): Promise<Note> {
    return await getNoteById(noteId) as never as Promise<Note>;
}

async function getNotesChoices(): Promise<Array<{name: string | undefined, value: ObjectId | undefined}>> {
    const notes = await getAll();
    return notes.map(({title, _id}: Partial<Note>) => ({name: title, value: _id}));
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

export async function getUpdatedNote() {
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