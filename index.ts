#!/usr/bin/env ts-node

import inquirer from 'inquirer';
import {getAll, remove, save} from "./db/mongo";
import {Note} from "./models/note";
import {action, Actions} from "./questions/action";
import {Colors} from "./colors";
import {getFieldsData, isDateFormat, printPrettyNote} from "./utils/utils";
import {getNoteId, getNoteInfo, getSearchStr, getUpdatedNote} from "./inquire";

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

async function listNotes() {
  try {
    const notes = await getAll();
    if (notes.length) console.log('- - - - - 1 - - - - -');
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
    console.log(`${Colors.Red}Error:${Colors.Reset} failed to fetch notes:`, e);
  }
}

async function createNote() {
  try {
    const note = await getNoteInfo();
    await save(note);
    console.log(`${Colors.Green}Done:${Colors.Reset} note created successfully`);
  } catch (e) {
    console.log(`${Colors.Red}Error:${Colors.Reset} failed to create note:`, e);
  }
}

async function removeNote() {
  try {
    const id = await getNoteId();
    await remove(id);
    console.log(`${Colors.Green}Done:${Colors.Reset} note deleted successfully`);
  } catch (e) {
    console.log(`${Colors.Red}Error:${Colors.Reset} failed to delete note:`, e);
  }
}
async function updateNote() {
  try {
    const updatedNote = await getUpdatedNote();
    await save(updatedNote);
    console.log(`${Colors.Green}Done:${Colors.Reset} note updated successfully`);
  } catch (e) {
    console.log(`${Colors.Red}Error:${Colors.Reset} failed to update note:`, e);
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
        printPrettyNote(idx, titles, texts, createdAts, 'createdAt', [createdAt]);
      }
    });
    return;
  }
  let foundMatchInTitle = false;
  titles.forEach((title: string, idx: number) => {
    const regex = new RegExp(searchStr, 'i');
    if (title.match(regex)) {
      foundMatchInTitle = true;
      printPrettyNote(idx, titles, texts, createdAts, 'title', title.match(regex) as string[]);
    }
  })
  let foundMatchInText = false;
  if (!foundMatchInTitle) {
    texts.forEach((text: string, idx: number) => {
      const regex = new RegExp(searchStr, 'i');
      if (text.match(regex)) {
        foundMatchInText = true;
        printPrettyNote(idx, titles, texts, createdAts, 'text', text.match(regex) as string[]);
      }
    })
  }
  if (!foundMatchInText) console.log('No note found that matches your search.');
}

;(async () => {
  await prompt();
  process.exit(1);
  // todo (bonus - fuzzy find, using score)
})();
