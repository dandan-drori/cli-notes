import inquirer from 'inquirer'
import { ObjectId } from "mongodb";
import { Note } from "./models/note";
import { unlockNote as unlockNoteDb } from "./db/mongo";
import { noteToUnlockQuestion, notePasswordQuestion} from "./questions";
import { Logger } from './utils/logger';
import { Colors } from './colors';

const logger = new Logger();

export async function retryUnlock(lockedNotes: Note[]): Promise<boolean> {
	const {noteToUnlock, isNoteUnlocked} = await unlockNotesPrompt(lockedNotes);
	if (isNoteUnlocked) {
		printNote(noteToUnlock);
		return true;
	}
	return false;
}

export async function unlockNotesPrompt(lockedNotes: Note[]): Promise<{noteToUnlock: Note; isNoteUnlocked: boolean}> {
    const choices = lockedNotes.map(({title, _id}: Partial<Note>) => ({name: title as string, value: _id as ObjectId}));
    const questions = [{...noteToUnlockQuestion, choices}];
    const {noteId} = await inquirer.prompt(questions);
    const noteToUnlock = lockedNotes.find((note: Note) => note._id === noteId);
    if (!noteToUnlock) return { noteToUnlock: lockedNotes[0], isNoteUnlocked: false };
    const {password} = await inquirer.prompt(notePasswordQuestion);
    const isNoteUnlocked = await unlockNoteDb(noteToUnlock, password);
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