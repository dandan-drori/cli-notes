#!/usr/bin/env ts-node

import inquirer from 'inquirer';
import {getAll, remove, save} from "./db/mongo";
import {Note} from "./models/note";
import {action, Actions} from "./questions/action";
import {noteInfo} from "./questions/noteInfo";
import {noteId as noteIdQuestion} from './questions/noteId';
import {Colors} from "./colors";

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

async function getNoteInfo() {
  const {title, text} = await inquirer.prompt(noteInfo);
  const createdAt = new Date().toISOString();
  return {title, text, createdAt};
}

async function getNoteId() {
  const notes = await getAll();
  const choices = notes.map(({title, _id}: Partial<Note>) => ({name: title, value: _id}));
  const questions = [{...noteIdQuestion[0], choices}];
  const {noteId} = await inquirer.prompt(questions);
  return noteId;
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
async function updateNote() {}
async function getNote() {}
async function searchNotes() {
  // todo start with checking if the input is a type of date - then search for createdAt that matches (exact date or exact hour)
  // todo if the input is plain text (not a date) - start by searching for a match in title (bonus - fuzzy find, like ignore case and match no only beggining using regex)
  // todo if still no match is found - search for a match in the text
}

;(async () => {
  await prompt();
  process.exit(1);
})();
