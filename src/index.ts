#!/usr/bin/env ts-node

import inquirer from 'inquirer';
import {getAll, remove, removeLockFromNote, save} from "./db/mongo";
import {Note} from "./models/note";
import {action, Actions} from "./questions/action";
import {getFieldsData, getLockedNotes, isDateFormat, printNote, printNoteList, printPrettyNote} from "./utils/utils";
import {
  getNoteId,
  getNoteInfo,
  getSearchStr,
  getUpdatedNote,
  lockNote as lockNoteInquirer,
  unlockNotesPrompt,
  shareNote as shareNoteInquirer,
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
    [Actions.unlock]: unlockNote,
    [Actions.share]: shareNote,
  }
  await ActionsFunctions[answers.action as Actions]();
}

async function listNotes() {
  try {
    const notes = await getAll();
    if (notes.length) console.log('- - - - - 1 - - - - -');
    const lockedNotes = printNoteList((notes as Note[]).reverse());
    if (!lockedNotes.length) return;
    const [noteToUnlock, isNoteUnlocked] = await unlockNotesPrompt(lockedNotes);
    if (!isNoteUnlocked) return logger.error('incorrect password');
    printNote(noteToUnlock as Note);
  } catch (e) {
    logger.error(`failed to fetch notes: ${e}`);
  }
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
  const {titles, texts, lastModifieds} = getFieldsData(notes as Note[]);
  const searchStr = await getSearchStr();
  if (isDateFormat(searchStr)) {
    lastModifieds.forEach((lastModified: string, idx: number) => {
      const date = new Date(lastModified).toLocaleDateString('he-il');
      if (date === searchStr) {
        printPrettyNote(idx, titles, texts, lastModifieds, 'lastModified', [lastModified]);
      }
    });
    return;
  }
  let foundMatchInTitle = false;
  titles.forEach((title: string, idx: number) => {
    const regex = new RegExp(searchStr, 'i');
    if (title.match(regex)) {
      foundMatchInTitle = true;
      printPrettyNote(idx, titles, texts, lastModifieds, 'title', title.match(regex) as string[]);
    }
  })
  let foundMatchInText = false;
  if (!foundMatchInTitle) {
    texts.forEach((text: string, idx: number) => {
      const regex = new RegExp(searchStr, 'i');
      if (text.match(regex)) {
        foundMatchInText = true;
        printPrettyNote(idx, titles, texts, lastModifieds, 'text', text.match(regex) as string[]);
      }
    })
  }
  if (!foundMatchInTitle && !foundMatchInText) logger.info('Sorry, we couldn\'t find a note that matches your search.');
}

async function lockNote() {
  try {
    await lockNoteInquirer();
    logger.success('note locked successfully');
  } catch (e) {
    logger.error(`failed to lock note: ${e}`);
  }
}

async function unlockNote() {
  try {
    const lockedNotes = await getLockedNotes();
    const [noteToUnlock, isNoteUnlocked] = await unlockNotesPrompt(lockedNotes);
    if (!isNoteUnlocked) return logger.error('incorrect password');
    await removeLockFromNote(noteToUnlock as Note);
    logger.success('note unlocked successfully');
    printNote(noteToUnlock as Note);
  } catch (e) {
    logger.error(`failed to unlock note: ${e}`);
  }
}

async function shareNote() {
  try {
    const dateCreated = await shareNoteInquirer();
    if (!dateCreated) return logger.error('incorrect password');
    logger.success(`message sent successfully at ${dateCreated}`);
  } catch (e) {
    logger.error(`failed to share note: ${e}`);
  }
}

;(async () => {
  await prompt();
  process.exit(1);
})();
