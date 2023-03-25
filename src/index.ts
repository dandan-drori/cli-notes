#!/usr/bin/env ts-node

import inquirer from 'inquirer';
import { getAll, remove, removeLockFromNote, save } from './db/mongo';
import { Note } from './models/note';
import { action, Actions } from './questions/action';
import {
	getFieldsData,
	getLockedNotes,
	isDateFormat,
	printNote,
	printNoteList,
	printPrettyNote,
  retryUnlock,
  unlockNoteWithRetry,
} from './utils/utils';
import {
	getNoteId,
	getNoteInfo,
	getSearchStr,
	getUpdatedNote,
	lockNote as lockNoteInquirer,
	unlockNotesPrompt,
	shareNote as shareNoteInquirer,
  editTags as editTagsInquirer,
} from './inquire';
import { Logger } from './utils/logger';

const logger = new Logger();

async function prompt() {
	const answers = await inquirer.prompt(action);
	const ActionsFunctions = {
		[Actions.list]: listNotes,
		[Actions.create]: createNote,
		[Actions.remove]: removeNote,
		[Actions.update]: updateNote,
		[Actions.search]: searchNotes,
		[Actions.lock]: lockNote,
		[Actions.unlock]: unlockNote,
		[Actions.share]: shareNote,
    [Actions.editTags]: editTags,
	};
	await ActionsFunctions[answers.action as Actions]();
}

async function listNotes() {
	try {
		const notes = await getAll();
		if (notes.length) logger.info('- - - - - 1 - - - - -');
		const lockedNotes = printNoteList((notes as Note[]).reverse());
		if (!lockedNotes.length) return;
		let isNoteUnlocked = await retryUnlock(lockedNotes);
		while (!isNoteUnlocked) {
			logger.error('Incorrect password');
			isNoteUnlocked = await retryUnlock(lockedNotes);
		}
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
	const { titles, texts, createdAts } = getFieldsData(notes as Note[]);
	const searchStr = await getSearchStr();
	if (isDateFormat(searchStr)) {
		createdAts.forEach((createdAt: string, idx: number) => {
			const date = new Date(createdAt).toLocaleDateString('he-IL');
			if (date === searchStr) {
				if (notes[idx].password) {
          logger.info('This note is locked!');
					return;
				}
				printPrettyNote(idx, titles, texts, createdAts, 'createdAt', [createdAt]);
			}
		});
		return;
	}
	let foundMatchInTitle = false;
	for (let i = 0; i < titles.length; ++i) {
		const title = titles[i];
		const regex = new RegExp(searchStr, 'i');
		if (title.match(regex)) {
			foundMatchInTitle = true;
			await unlockNoteWithRetry(notes[i] as Note);
			printPrettyNote(i, titles, texts, createdAts, 'title', title.match(regex) as string[]);
		}
	}
	let foundMatchInText = false;
	if (!foundMatchInTitle) {
    for (let i = 0; i < titles.length; ++i) {
      const text = texts[i];
			const regex = new RegExp(searchStr, 'i');
			if (text.match(regex)) {
				foundMatchInText = true;
				await unlockNoteWithRetry(notes[i] as Note);
				printPrettyNote(i, titles, texts, createdAts, 'text', text.match(regex) as string[]);
			}
		};
	}
	if (!foundMatchInTitle && !foundMatchInText) {
		logger.info('No note found that matches your search.');
  }
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
		if (!isNoteUnlocked) return logger.error('Incorrect password');
		await removeLockFromNote(noteToUnlock as Note);
		logger.success('Note unlocked successfully');
		printNote(noteToUnlock as Note);
	} catch (e) {
		logger.error(`Failed to unlock note: ${e}`);
	}
}

async function shareNote() {
	try {
		const dateCreated = await shareNoteInquirer();
		if (!dateCreated) return logger.error('Incorrect password');
		logger.success(`Message sent successfully at ${dateCreated}`);
	} catch (e) {
		logger.error(`Failed to share note: ${e}`);
	}
}

async function editTags() {
  try {
    const res = await editTagsInquirer();
    logger.success(`Note's tags edited successfully`);
  } catch (e) {
		logger.error(`Failed to edit note's tags: ${e}`);
  }
}

(async () => {
	await prompt();
	process.exit(1);
})();
