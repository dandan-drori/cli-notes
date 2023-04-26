#!/usr/bin/env ts-node

import inquirer from 'inquirer';
import { getAll, remove, removeLockFromNote, save } from './db/mongo';
import { Note } from './models/note';
import { action, Actions } from './questions/action';
import {
	getFieldsData,
	getLockedNotes,
	isDateFormat,
	printNoteList,
	printPrettyNote,
	unlockNoteWithRetry,
} from './utils/utils';
import {
	getNoteId,
	getNoteInfo,
	getSearchStr,
	getUpdatedNote,
	lockNote as lockNoteInquirer,
	shareNote as shareNoteInquirer,
	manageTags as manageTagsInquirer,
} from './inquire';
import { Logger } from './utils/logger';
import { printNote, retryUnlock, unlockNotesPrompt } from './noteOperations';
import { getTag, getNotesWithTag } from './tagOperations';
import { Tag } from './models/tag';
import { getSettings, updateSettings } from './db/settings';
import { getUpdatedSettings } from './settingsOperations';

const logger = new Logger();

async function prompt() {
	const answers = await inquirer.prompt(action);
	const ActionsFunctions = {
		[Actions.list]: listNotes,
		[Actions.create]: createNote,
		[Actions.remove]: removeNote,
		[Actions.update]: updateNote,
		[Actions.search]: searchNotes,
		[Actions.filter]: filterNotesByTag,
		[Actions.lock]: lockNote,
		[Actions.unlock]: unlockNote,
		[Actions.share]: shareNote,
		[Actions.tags]: manageTags,
		[Actions.settings]: editSettings,
	};
	await ActionsFunctions[answers.action as Actions]();
}

async function listNotes() {
	try {
		const notes = await getAll();
		if (notes.length) logger.info('\n  - - - - - 1 - - - - -');
		const lockedNotes = await printNoteList((notes as Note[]));
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
		searchNotesByDate(notes, titles, texts, createdAts, searchStr);
	} else {
		const foundMatchInTitle = await searchNotesByTitle(notes, titles, texts, createdAts, searchStr);
		if (!foundMatchInTitle) {
			await searchNotesByText(notes, titles, texts, createdAts, searchStr);
		}
	}
}

async function filterNotesByTag(): Promise<void> {
	const notes = await getAll();
	const tag = await getTag();
	const notesFilteredByTag = await getNotesByTag(notes, tag);
	const lockedNotes = await printNoteList(notesFilteredByTag);
	for await (const note of lockedNotes) {
		await unlockNoteWithRetry(note);
	}
}

function searchNotesByDate(notes: Note[], titles: string[], texts: string[], createdAts: string[], searchStr: string) {
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
}

async function searchNotesByTitle(notes: Note[], titles: string[], texts: string[], createdAts: string[], searchStr: string): Promise<boolean> {
	let foundMatch = false;
	for (let i = 0; i < titles.length; ++i) {
		const title = titles[i];
		const regex = new RegExp(searchStr, 'i');
		if (title.match(regex)) {
			foundMatch = true;
			if (notes[i]) {
				await unlockNoteWithRetry(notes[i]);
			}
			printPrettyNote(i, titles, texts, createdAts, 'title', title.match(regex) as string[]);
		}
	}
	return foundMatch;
}

async function searchNotesByText(notes: Note[], titles: string[], texts: string[], createdAts: string[], searchStr: string): Promise<void> {
	for (let i = 0; i < texts.length; ++i) {
		const text = texts[i];
		const regex = new RegExp(searchStr, 'i');
		if (text.match(regex)) {
			if (notes[i]) {
				await unlockNoteWithRetry(notes[i]);
			}
			printPrettyNote(i, titles, texts, createdAts, 'text', text.match(regex) as string[]);
		}
	}
}

async function getNotesByTag(notes: Note[], tag: Tag): Promise<Note[]> {
	return await getNotesWithTag(notes, tag);
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
		const { noteToUnlock, isNoteUnlocked } = await unlockNotesPrompt(lockedNotes);
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

async function manageTags() {
	try {
		await manageTagsInquirer();
	} catch (e) {
		logger.error(`Failed to edit note's tags: ${e}`);
	}
}

async function editSettings() {
	try {
		const settings = await getSettings();
		const updatedSettings = await getUpdatedSettings();
		await updateSettings({ _id: settings._id, ...updatedSettings });
		logger.success('Settings saved successfully');
	} catch (e) {
		logger.error(`Failed to edit settings: ${e}`)
	}
}

(async () => {
	while(true) {
		await prompt();
	}
	// process.exit(1);
})();
