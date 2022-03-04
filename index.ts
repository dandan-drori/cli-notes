#!/usr/bin/env ts-node

import inquirer from 'inquirer';
import {getAll, getNoteById, remove, save} from "./db/mongo";
import {Note} from "./models/note";
import {action, Actions} from "./questions/action";
import {noteInfo} from "./questions/noteInfo";
import {noteId as noteIdQuestion} from './questions/noteId';
import {Colors} from "./colors";
import {noteToUpdate as noteToUpdateQuestion} from "./questions/noteToUpdate";
import {searchStr as searchStrQuestion} from "./questions/searchStr";
import {ObjectId} from "mongodb";

async function prompt() {
  const answers = await inquirer.prompt(action)
  const ActionsFunctions = {
    [Actions.list]: listNotes,
    [Actions.create]: createNote,
    [Actions.remove]: removeNote,
    [Actions.update]: updateNote,
    [Actions.search]: searchNotes,
  }
  await ActionsFunctions[answers.action as Actions]();
}

function isDateFormat(str: string): boolean {
  const regex = /\d{1,2}\.\d{1,2}\.\d{4}/ig;
  return regex.test(str);
}

function getFieldsData(notes: Note[]): {titles: string[], texts: string[], createdAts: string[]} {
  return notes.reduce((acc: {titles: string[], texts: string[], createdAts: string[]}, {title, text, createdAt}: Note) => {
    acc = {titles: [...acc.titles, title], texts: [...acc.texts, text], createdAts: [...acc.createdAts, createdAt]};
    return acc;
  }, {titles: [], texts: [], createdAts: []});
}

async function getSearchStr(): Promise<string> {
  const {searchStr} = await inquirer.prompt(searchStrQuestion);
  return searchStr;
}

async function getNoteInfo(): Promise<Note> {
  const {title, text} = await inquirer.prompt(noteInfo);
  const createdAt = new Date().toISOString();
  return {title, text, createdAt};
}

async function getNotesChoices(): Promise<Array<{name: string | undefined, value: ObjectId | undefined}>> {
  const notes = await getAll();
  return notes.map(({title, _id}: Partial<Note>) => ({name: title, value: _id}));
}

async function getNoteId(): Promise<string> {
  const choices = await getNotesChoices();
  const questions = [{...noteIdQuestion, choices}];
  const {noteId} = await inquirer.prompt(questions);
  return noteId;
}

function buildNoteStr(note: Note): string {
  let noteStr = ``;
  noteStr += new Date(note.createdAt).toLocaleString('he-il');
  for (const key in note) {
    if (key === '_id' || key === 'createdAt') continue;
    noteStr += '\n\n' + note[key as keyof Note];
  }
  return noteStr;
}

function buildDecoratedNoteStr(note: Note): string {
  let noteStr = ``;
  noteStr += `${Colors.Dim}${new Date(note.createdAt).toLocaleString('he-il')}${Colors.Reset}`;
  for (const key in note) {
    if (key === '_id' || key === 'createdAt') continue;
    const style = key === 'title' ? `${Colors.Bright}${Colors.Underscore}` : '';
    if (key === 'text') {
      noteStr += '\n\n' + style + (note[key as keyof Note] as string).split('\\n').join('\n') + Colors.Reset;
      continue;
    }
    noteStr += '\n\n' + style + note[key as keyof Note] + Colors.Reset;
  }
  return noteStr;
}

async function getNote(noteId: string): Promise<Note> {
  return await getNoteById(noteId) as never as Promise<Note>;
}

async function getUpdatedNote() {
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
  const [title, text, createdAt] = updatedNoteStr.split('\n\n');
  return {
    _id: noteId,
    title,
    text,
    createdAt: new Date(createdAt.trim()).toISOString()
  }
}

async function listNotes() {
  try {
    const notes = await getAll();
    console.log('- - - - - 1 - - - - -');
    notes.reverse().forEach(({createdAt, title, text}:  any, idx: number) => {
      const textArr = text.split('\\n');
      console.log(
`
${Colors.Dim}${new Date(createdAt).toLocaleString('he-il')}${Colors.Reset}

${Colors.Underscore}${Colors.Bright}${title}${Colors.Reset}

${textArr.join('\n')}

- - - - - ${idx + 1 < notes.length ? idx + 2 : '-'} - - - - -`
      );
    })
  } catch (e) {
    console.log('Error: failed to fetch notes:', e);
  }
}

async function createNote() {
  try {
    const note = await getNoteInfo();
    return await save(note);
  } catch (e) {
    console.log('Error: unable to create a note', e);
  } finally {
    console.log('Note created successfully');
  }
}

async function removeNote() {
  try {
    const id = await getNoteId();
    await remove(id);
  } catch (e) {
    console.log('Error: unable to delete note', e);
  } finally {
    console.log('Note deleted successfully');
  }
}
async function updateNote() {
  try {
    const updatedNote = await getUpdatedNote();
    await save(updatedNote);
    console.log('Note updated successfully');
  } catch (e) {
    console.log('Error: failed to update note:', e);
  }
}

async function searchNotes() {
  const notes = await getAll();
  const {titles, texts, createdAts} = getFieldsData(notes as Note[]);
  const searchStr = await getSearchStr();
  const isDate = isDateFormat(searchStr);
  if (isDate) {
    createdAts.forEach((createdAt: string, idx: number) => {
      const date = new Date(createdAt).toLocaleDateString('he-il');
      if (date === searchStr) {
        printPrettyNote(idx, titles, texts, createdAts);
      }
    });
    return;
  }
  let foundMatchInTitle = false;
  titles.forEach((title: string, idx: number) => {
    const regex = new RegExp(searchStr, 'i');
    if (title.match(regex)) {
      foundMatchInTitle = true;
      printPrettyNote(idx, titles, texts, createdAts);
    }
  })
  let foundMatchInText = false;
  if (!foundMatchInTitle) {
    texts.forEach((text: string, idx: number) => {
      const regex = new RegExp(searchStr, 'i');
      if (text.match(regex)) {
        foundMatchInText = true;
        printPrettyNote(idx, titles, texts, createdAts);
      }
    })
  }
  if (!foundMatchInText) console.log('No note found that matches your search.');
  // todo (bonus - fuzzy find, using score)

  function printPrettyNote(idx: number, titles: string[], texts: string[], createdAts: string[]) {
    const note = {
      title: titles[idx],
      text: texts[idx],
      createdAt: createdAts[idx]
    }
    console.log(
        `
${buildDecoratedNoteStr(note)}

- - - - - - - - - - -`);
  }
}

;(async () => {
  await prompt();
  process.exit(1);
})();
