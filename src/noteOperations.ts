import inquirer from 'inquirer'
import type { ObjectId } from "mongodb";
import { Note } from "./models/note";
import { isPasswordMatch, unlockNote as unlockNoteDb } from "./db/mongo";
import { noteToUnlockQuestion, notePasswordQuestion} from "./questions";
import { Logger } from './utils/logger';
import { Colors } from './colors';
import { getSettings } from './db/settings';

const logger = new Logger();

export async function retryUnlock(lockedNotes: Note[], skipPrintNote = false): Promise<boolean> {
    const { mainPassword } = await getSettings();
	const { noteToUnlock, isNoteUnlocked } = await unlockNotesPrompt(lockedNotes, mainPassword);
	if (isNoteUnlocked && !skipPrintNote) {
		printNote(noteToUnlock);
	}
    return isNoteUnlocked;
}

export async function unlockNotesPrompt(lockedNotes: Note[], mainPassword: string): Promise<{noteToUnlock: Note; isNoteUnlocked: boolean}> {
    const choices = lockedNotes.map(({title, _id}: Partial<Note>) => ({name: title as string, value: _id as ObjectId}));
    const questions = [{...noteToUnlockQuestion, choices}];
    const {noteId} = await inquirer.prompt(questions);
    const noteToUnlock = lockedNotes.find((note: Note) => note._id === noteId);
    if (!noteToUnlock) return { noteToUnlock: lockedNotes[0], isNoteUnlocked: false };
    const { password } = await inquirer.prompt(notePasswordQuestion);
    const isNoteUnlocked = mainPassword ? await isPasswordMatch(password, mainPassword) : await unlockNoteDb(noteToUnlock, password);
    return { noteToUnlock, isNoteUnlocked: !!isNoteUnlocked };
}

export function printNote(note: Note) {
	const noteStr = buildDecoratedNoteStr(note);
	logger.info(
		`- - - - - - - - - - -

${noteStr}        
- - - - - - - - - - -`
	);
}


function buildDecoratedDate(note: Partial<Note>, dateIsMatch?: boolean): string {
    const date = new Date(note.createdAt as string).toLocaleString('he-IL');
    const decorateDate = dateIsMatch ? `${Colors.Bright}${Colors.Red}` : '';
    return `${Colors.Dim}${decorateDate}${date}${Colors.Reset}`;
}

function buildDecoratedTitle(title: string): string {
    return `${Colors.Bright}${Colors.Underscore}${title}${Colors.Reset}`;
}

function buildDecoratedText(text: string): string {
    return text.split('\\n').join('\n');
}

export function buildDecoratedNoteStr(note: Note, dateIsMatch?: boolean): string {
    const decoratedDate = buildDecoratedDate(note, dateIsMatch);
    const decoratedTitle = buildDecoratedTitle(note.title);
    const decoratedText = buildDecoratedText(note.text);

    return `
${decoratedDate}

${decoratedTitle}

${decoratedText}
`;
}