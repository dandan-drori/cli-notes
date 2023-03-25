import dotenv from 'dotenv';
dotenv.config();
import { Note } from '../models/note';
import { Colors } from '../colors';
import { getAll } from '../db/mongo';
import clientInit from 'twilio';
import { Logger } from './logger'
import { unlockNotesPrompt } from '../inquire';

const logger = new Logger();

export function buildDecoratedNoteStr(note: Partial<Note>, dateIsMatch?: boolean): string {
	const date = new Date(note.createdAt as string).toLocaleString('he-IL');
	const decorateDate = dateIsMatch ? `${Colors.Bright}${Colors.Red}` : '';
	let noteStr = ``;
	noteStr += `${Colors.Dim}${decorateDate}${date}${Colors.Reset}`;
	const keysToSkip = ['_id', 'lastModified', 'createdAt', 'password'];
	for (const key in note) {
		if (keysToSkip.includes(key)) continue;
		const style = key === 'title' ? `${Colors.Bright}${Colors.Underscore}` : '';
		if (key === 'text') {
			noteStr +=
				'\n\n' + style + (note[key as keyof Note] as string).split('\\n').join('\n') + Colors.Reset;
			continue;
		}
		noteStr += '\n\n' + style + note[key as keyof Note] + Colors.Reset;
	}
	return noteStr;
}

export function isDateFormat(str: string): boolean {
	const regex = /\d{1,2}\.\d{1,2}\.\d{4}/gi;
	return regex.test(str);
}

export function getFieldsData(notes: Note[]): {
	titles: string[];
	texts: string[];
    createdAts: string[];
	lastModifieds: string[];
} {
	return notes.reduce(
		(
			acc: { titles: string[]; texts: string[]; createdAts: string[]; lastModifieds: string[] },
			{ title, text, createdAt, lastModified }: Note
		) => {
			acc = {
				titles: [...acc.titles, title],
				texts: [...acc.texts, text],
				lastModifieds: [...acc.lastModifieds, lastModified],
                createdAts: [...acc.createdAts, createdAt],
			};
			return acc;
		},
		{ titles: [], texts: [], lastModifieds: [], createdAts: [] }
	);
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

export function getIndicesOf(searchStr: string, str: string, caseSensitive: boolean = false) {
	let searchStrLen = searchStr.length;
	if (searchStrLen == 0) return [];
	let startIndex = 0,
		index,
		indices = [];
	if (!caseSensitive) {
		str = str.toLowerCase();
		searchStr = searchStr.toLowerCase();
	}
	while ((index = str.indexOf(searchStr, startIndex)) > -1) {
		indices.push(index);
		startIndex = index + searchStrLen;
	}
	return indices;
}

export function printPrettyNote(
	idx: number,
	titles: string[],
	texts: string[],
	createdAts: string[],
	field: 'title' | 'text' | 'createdAt',
	matches: string[]
) {
	const note = {
		title: titles[idx],
		text: texts[idx],
		createdAt: createdAts[idx],
	};
	if (field !== 'createdAt') {
		const match = matches[0];
		const indices = getIndicesOf(match, note[field]);
		const colorsLength = Colors.Bright.length + Colors.Red.length + Colors.Reset.length;
		indices.forEach((startIdx: number, idx: number) => {
			startIdx = startIdx + colorsLength * idx;
			const endIdx = startIdx + match.length;
			note[field] = `${note[field].slice(0, startIdx)}${Colors.Bright}${Colors.Red}${note[
				field
			].slice(startIdx, endIdx)}${Colors.Reset}${note[field].slice(endIdx)}`;
		});
	}
	logger.info(
		`
${buildDecoratedNoteStr(note, field === 'createdAt')}

- - - - - - - - - - -`
	);
}

export function printNote(note: Note) {
	const noteStr = buildDecoratedNoteStr(note);
	logger.info(
		`- - - - - - - - - - -

${noteStr}        
- - - - - - - - - - -`
	);
}

export function printNoteList(notes: Note[]): Note[] {
	const lockedNotes: Note[] = [];
	const sortBy = 'createdAt';
	const sortedNotes = sortNotesBy(notes, sortBy);
	notes.forEach((note: Note, idx: number) => {
		const { createdAt, title, text, password } = note;
		const decoratedDate = decorateText(Colors.Dim, new Date(createdAt).toLocaleString('he-IL'));
		const decoratedTitle = decorateText(Colors.Underscore + Colors.Bright, title);
		if (password) {
			lockedNotes.push(note);
			const lockedWarning = decorateText(Colors.Red + Colors.Bright, 'This note is Locked!');
			logger.info(
				`
${decoratedDate}

${decoratedTitle}

${lockedWarning}

- - - - - ${idx + 1 < notes.length ? idx + 2 : '-'} - - - - -`
			);
			return;
		}

		const textArr = text.split('\\n');
		logger.info(
			`
${decoratedDate}

${decoratedTitle}

${textArr.join('\n')}

- - - - - ${idx + 1 < notes.length ? idx + 2 : '-'} - - - - -`
		);
	});
	return lockedNotes;
}

export async function getLockedNotes(): Promise<Note[]> {
	const notes = await getAll();
	return notes.filter(note => note.password) as Note[];
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
        ? new Date(note.lastModified).toLocaleString('he-il')
        : new Date().toLocaleString('he-il');
    const keysToSkip = ['_id', 'lastModified', 'createdAt', 'password'];
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

export function sortNotesBy(notes: Note[], sortBy: 'createdAt' | 'title' | 'text'): Note[] {
	return notes.sort((a: Note, b: Note) => {
		return a[sortBy] > b[sortBy] ? 1 : a[sortBy] < b[sortBy] ? -1 : 0;
	});
}

export async function retryUnlock(lockedNotes: Note[]): Promise<boolean> {
	const [noteToUnlock, isNoteUnlocked] = await unlockNotesPrompt(lockedNotes);
	if (isNoteUnlocked) {
		printNote(noteToUnlock as Note);
		return true;
	}
	return false;
}

export async function unlockNoteWithRetry(note: Note) {
	if (note.password) {
        logger.info('This note is locked!');
		let isNoteUnlocked = await retryUnlock([note] as Note[]);
		while (!isNoteUnlocked) {
			logger.error('Incorrect password');
			isNoteUnlocked = await retryUnlock([note] as Note[]);
		}
	}
}