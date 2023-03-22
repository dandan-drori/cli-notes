#!/usr/bin/env ts-node

import inquirer from 'inquirer';
import {getAll, remove, save} from "./db/mongo";
import {Note} from "./models/note";
import {action, Actions} from "./questions/action";
import {getFieldsData, isDateFormat, printNote, printNoteList, printPrettyNote} from "./utils/utils";
import {
  getNoteId,
  getNoteInfo,
  getSearchStr,
  getUpdatedNote,
  lockNote as lockNoteInquirer, unlockNotesPrompt
} from "./inquire";
import {Logger} from "./utils/logger";

const logger = new Logger();

async function prompt() {
  const answers = await inquirer.prompt(action)
  const ActionsFunctions = {
    [Actions.list]: listNotes,
    [Actions.create]: createNote,
    [Actions.remove]: removeNote,
    [Actions.update]: updateNote,
    [Actions.search]: searchNotes,
    [Actions.lock]: lockNote,
  }
  await ActionsFunctions[answers.action as Actions]();
}

async function listNotes() {
  try {
    const notes = await getAll();
    if (notes.length) console.log('- - - - - 1 - - - - -');
    const lockedNotes = printNoteList((notes as Note[]).reverse());
    if (!lockedNotes.length) return;
    let isNoteUnlocked = await retryUnlock(lockedNotes);
    while(!isNoteUnlocked) {
      isNoteUnlocked = await retryUnlock(lockedNotes);
    }
    logger.error('Incorrect password');
  } catch (e) {
    logger.error(`failed to fetch notes: ${e}`);
  }
}

async function retryUnlock(lockedNotes: Note[]): Promise<boolean> {
    const [noteToUnlock, isNoteUnlocked] = await unlockNotesPrompt(lockedNotes);
    if (isNoteUnlocked) {
      printNote(noteToUnlock as Note);
      return true;
    }
    return false;
}

async function createNote() {
  try {
    const note = await getNoteInfo();
    await save(note);
    logger.success('note created successfully');
  } catch (e) {
    logger.error(`failed to create note: ${e}`);
  }
}

async function removeNote() {
  try {
    const id = await getNoteId();
    await remove(id);
    logger.success('note deleted successfully');
  } catch (e) {
    logger.error(`failed to delete note: ${e}`);
  }
}

async function updateNote() {
  try {
    const updatedNote = await getUpdatedNote();
    await save(updatedNote);
    logger.success('note updated successfully');
  } catch (e) {
    logger.error(`failed to update note: ${e}`);
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
	if (notes[idx].password) {
          console.log('This note is locked!');
	  return;
	}
        printPrettyNote(idx, titles, texts, createdAts, 'createdAt', [createdAt]);
      }
    });
    return;
  }
  let foundMatchInTitle = false;
  for (let i=0; i<titles.length; ++i) {
    const title = titles[i];
    const regex = new RegExp(searchStr, 'i');
    if (title.match(regex)) {
      foundMatchInTitle = true;
      if (notes[i].password) {
        console.log('This note is locked!');
	let isNoteUnlocked = await retryUnlock([notes[i]] as Note[]);
	while(!isNoteUnlocked) {
	  isNoteUnlocked = await retryUnlock([notes[i]] as Note[]);
	}
      } 
      printPrettyNote(i, titles, texts, createdAts, 'title', title.match(regex) as string[]);
   }
  }
  let foundMatchInText = false;
  if (!foundMatchInTitle) {
    texts.forEach((text: string, idx: number) => {
      const regex = new RegExp(searchStr, 'i');
      if (text.match(regex)) {
        foundMatchInText = true;
        if (notes[idx].password) {
          console.log('This note is locked!');
        } else {
        printPrettyNote(idx, titles, texts, createdAts, 'text', text.match(regex) as string[]);
	}
      }
    })
  }
  if (!foundMatchInTitle && !foundMatchInText) logger.info('No note found that matches your search.');
}

async function lockNote() {
  try {
    await lockNoteInquirer();
    logger.info('Note locked successfully');
  } catch (e) {
    logger.error(`failed to lock note: ${e}`);
  }
}

;(async () => {
  await prompt();
  process.exit(1);
})();
