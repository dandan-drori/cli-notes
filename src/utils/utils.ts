import dotenv from 'dotenv';
dotenv.config();
import { Note } from '../models/note';
import { Colors } from '../colors';
import { getAll } from '../db/mongo';
import clientInit from 'twilio';
import { Logger } from './logger';
import { buildDecoratedNoteStr, retryUnlock } from '../noteOperations';
import { Settings } from '../models/settings';
import { getSettings } from '../db/settings';
import { ColorNames } from '../colors/colorTypes';

const logger = new Logger();

export function isDateFormat(str: string): boolean {
	const regex = /\d{1,2}\.\d{1,2}\.\d{4}/gi;
	return regex.test(str);
}

function extractFieldValues(notes: Note[], field: keyof Note): string[] {
	return notes.map(note => note[field] as string);
}

export function getFieldsData(notes: Note[]): {
	titles: string[];
	texts: string[];
	createdAts: string[];
	lastModifieds: string[];
} {
	const titles = extractFieldValues(notes, 'title');
	const texts = extractFieldValues(notes, 'text');
	const createdAts = extractFieldValues(notes, 'createdAt');
	const lastModifieds = extractFieldValues(notes, 'lastModified');

	return { titles, texts, createdAts, lastModifieds };
}

export function buildNoteStr(note: Note): string {
	let noteStr = ``;
	noteStr += note.lastModified
		? new Date(note.lastModified).toLocaleString('he-il')
		: new Date().toLocaleDateString('he-il');
	const keysToSkip = ['_id', 'lastModified', 'createdAt', 'password'];
	for (const key in note) {
		if (keysToSkip.includes(key)) continue;
		noteStr += '\n\n' + note[key as keyof Note];
	}
	return noteStr;
}

function toLowerCaseIfInsensitive(str: string, caseSensitive: boolean): string {
	return caseSensitive ? str : str.toLowerCase();
}

function findNextIndex(str: string, searchStr: string, startIndex: number): number {
	return str.indexOf(searchStr, startIndex);
}

export function getIndicesOf(
	searchStr: string,
	str: string,
	caseSensitive: boolean = false
): number[] {
	const searchStrLen = searchStr.length;
	if (searchStrLen === 0) return [];

	str = toLowerCaseIfInsensitive(str, caseSensitive);
	searchStr = toLowerCaseIfInsensitive(searchStr, caseSensitive);

	const indices: number[] = [];
	let startIndex = 0;
	let index = findNextIndex(str, searchStr, startIndex);

	while (index > -1) {
		indices.push(index);
		startIndex = index + searchStrLen;
		index = findNextIndex(str, searchStr, startIndex);
	}

	return indices;
}

function highlightMatches(
	note: Note,
	field: 'title' | 'text' | 'createdAt',
	matches: string[],
	highlightColor: ColorNames
): Note {
	const match = matches[0];
	const indices = getIndicesOf(match, note[field]);
	const highlightColorCode = getColorCodeFromColorName(highlightColor);
	const colorsLength = Colors.Bright.length + highlightColorCode.length + Colors.Reset.length;
	const reset = field === 'title' ? `${Colors.Reset}${Colors.Underscore}` : Colors.Reset;

	indices.forEach((startIdx: number, idx: number) => {
		startIdx = startIdx + colorsLength * idx;
		const endIdx = startIdx + match.length;
		note[field] = `${note[field].slice(0, startIdx)}${Colors.Bright}${highlightColorCode}${note[
			field
		].slice(startIdx, endIdx)}${reset}${note[field].slice(endIdx)}`;
	});

	return note;
}

function createNoteObject(
	idx: number,
	titles: string[],
	texts: string[],
	createdAts: string[]
): Note {
	return {
		title: titles[idx],
		text: texts[idx],
		createdAt: createdAts[idx],
		lastModified: createdAts[idx],
		tags: [],
	};
}

export function printPrettyNote(
	idx: number,
	titles: string[],
	texts: string[],
	createdAts: string[],
	field: 'title' | 'text' | 'createdAt',
	matches: string[],
	highlightColor: ColorNames
) {
	let note = createNoteObject(idx, titles, texts, createdAts);

	if (field !== 'createdAt') {
		note = highlightMatches(note, field, matches, highlightColor);
	}

	logger.info(
		`
  ${buildDecoratedNoteStr(note, field === 'createdAt')}
  
  - - - - - - - - - - -`
	);
}

function printNote(
	note: Note,
	idx: number,
	notesLength: number,
	isLocked: boolean = false,
) {
	const { createdAt, title, text } = note;
	const decoratedDate = decorateText(Colors.Dim, new Date(createdAt).toLocaleString('he-IL'));
	const decoratedTitle = decorateText(Colors.Underscore + Colors.Bright, title);
	const textArr = text.split('\\n');
	const lockedWarning = decorateText(Colors.Red + Colors.Bright, 'This note is Locked!');
	const extraLine = idx + 1 === notesLength ? '\n' : '';

	logger.info(`
  ${decoratedDate}
  
  ${decoratedTitle}
  
  ${isLocked ? lockedWarning : textArr.join('\n')}
  
  - - - - - ${idx + 1 < notesLength ? idx + 2 : '-'} - - - - -${extraLine}`);
}

export async function printNoteList(notes: Note[]): Promise<Note[]> {
	const lockedNotes: Note[] = [];
	const { sortBy, sortDirection, mainPassword } = await getSettings();
	const sortedNotes = sortNotesBy(notes, sortBy, sortDirection);

	sortedNotes.forEach((note: Note, idx: number) => {
		if (note.password) {
			lockedNotes.push(note);
			printNote(note, idx, notes.length, true);
		} else {
			printNote(note, idx, notes.length, false);
		}
	});

	return lockedNotes;
}

export async function getLockedNotes(): Promise<Note[]> {
	const notes = await getAll();
	return notes.filter(note => note.password);
}

export async function shareNote(noteToShare: Note): Promise<String> {
	const client = clientInit(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
	const { dateCreated } = await client.messages.create({
		from: process.env.TWILIO_NUMBER as string,
		body: buildNoteString(noteToShare),
		to: process.env.YOUR_NUMBER as string,
	});
	return dateCreated.toLocaleString('he-IL');
}

function buildNoteString(note: Note): string {
	let noteStr = ``;
	noteStr += note.lastModified
		? new Date(note.lastModified).toLocaleString('he-IL')
		: new Date().toLocaleString('he-IL');
	const keysToSkip = ['_id', 'lastModified', 'createdAt', 'password', 'tags', 'deletedAt'];
	for (const key in note) {
		if (keysToSkip.includes(key)) continue;
		if (key === 'text') {
			const textArr = note.text.split('\\n');
			noteStr += '\n\n' + textArr.join('\n');
			continue;
		}
		noteStr += '\n\n' + note[key as keyof Note];
	}
	return noteStr;
}

export function convertDateStringToAmerican(generalDate: string): string {
	const [date, time] = generalDate.split(',');
	const [day, month, year] = date.split('.');
	const americanDate = [month, day, year].join('.');
	return [americanDate, time].join(',');
}

export function decorateText(decor: string, text: string): string {
	return `${decor}${text}${Colors.Reset}`;
}

export function sortNotesBy(
	notes: Note[],
	sortBy: 'createdAt' | 'title' | 'text' = 'createdAt',
	direction: 'asc' | 'desc' = 'desc'
): Note[] {
	const factor = direction === 'desc' ? 1 : -1;
	return notes.sort((a: Note, b: Note) => {
		let A = sortBy === 'createdAt' ? new Date(a[sortBy]) : a[sortBy];
		let B = sortBy === 'createdAt' ? new Date(b[sortBy]) : b[sortBy];
		return A > B ? -1 * factor : A < B ? 1 * factor : 0;
	});
}

export async function unlockNoteWithRetry(note: Note, skipPrintNote = false) {
	if (note.password) {
		logger.info('This note is locked!');
		let isNoteUnlocked = await retryUnlock([note], skipPrintNote);
		while (!isNoteUnlocked) {
			logger.error('Incorrect password');
			isNoteUnlocked = await retryUnlock([note], skipPrintNote);
		}
	}
}

export function getDefaultSettings(): Settings {
	return {
		sortBy: 'createdAt',
		sortDirection: 'desc',
		searchHighlightColor: 'red',
		mainPassword: '',
	};
}

export function getColorCodeFromColorName(colorName: ColorNames): string {
	const colorNamesToColorCodes = {
		red: Colors.Red,
		blue: Colors.Blue,
		green: Colors.Green,
		yellow: Colors.Yellow,
		pink: Colors.Magenta,
	};
	return colorNamesToColorCodes[colorName];
}
