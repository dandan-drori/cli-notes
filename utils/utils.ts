import {Note} from "../models/note";
import {Colors} from "../colors";

export function buildDecoratedNoteStr(note: Note, dateIsMatch?: boolean): string {
    const date = new Date(note.createdAt).toLocaleString('he-il');
    const decorateDate = dateIsMatch ? `${Colors.Bright}${Colors.Red}` : '';
    let noteStr = ``;
    noteStr += `${Colors.Dim}${decorateDate}${date}${Colors.Reset}`;
    for (const key in note) {
        if (key === '_id' || key === 'createdAt') continue;
        const style = key === 'title' ? `${Colors.Bright}${Colors.Underscore}` : '';
        if (key === 'text') {
            noteStr += '\n\n' + style + (note[key as keyof Note] as string).split('\\n').join('\n') + Colors.Reset;
            continue;
        }
        noteStr += '\n\n' + style + note[key as keyof Note] + Colors.Reset;
    }
    return noteStr;
}

export function isDateFormat(str: string): boolean {
    const regex = /\d{1,2}\.\d{1,2}\.\d{4}/ig;
    return regex.test(str);
}

export function getFieldsData(notes: Note[]): {titles: string[], texts: string[], createdAts: string[]} {
    return notes.reduce((acc: {titles: string[], texts: string[], createdAts: string[]}, {title, text, createdAt}: Note) => {
        acc = {titles: [...acc.titles, title], texts: [...acc.texts, text], createdAts: [...acc.createdAts, createdAt]};
        return acc;
    }, {titles: [], texts: [], createdAts: []});
}

export function buildNoteStr(note: Note): string {
    let noteStr = ``;
    noteStr += new Date(note.createdAt).toLocaleString('he-il');
    for (const key in note) {
        if (key === '_id' || key === 'createdAt') continue;
        noteStr += '\n\n' + note[key as keyof Note];
    }
    return noteStr;
}

export function getIndicesOf(searchStr: string, str: string, caseSensitive: boolean = false) {
    let searchStrLen = searchStr.length;
    if (searchStrLen == 0) return [];
    let startIndex = 0, index, indices = [];
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


export function printPrettyNote(idx: number, titles: string[], texts: string[], createdAts: string[], field: 'title' | 'text' | 'createdAt', matches: string[]) {
    const note = {
        title: titles[idx],
        text: texts[idx],
        createdAt: createdAts[idx]
    }
    if (field !== 'createdAt') {
        const match = matches[0];
        const indices = getIndicesOf(match, note[field]);
        const colorsLength = Colors.Bright.length + Colors.Red.length + Colors.Reset.length;
        indices.forEach((startIdx: number, idx: number) => {
            startIdx = startIdx + colorsLength * idx;
            const endIdx = startIdx + match.length;
            note[field] = `${note[field].slice(0, startIdx)}${Colors.Bright}${Colors.Red}${match}${Colors.Reset}${note[field].slice(endIdx)}`;
        })
    }
    console.log(
        `
${buildDecoratedNoteStr(note, field === 'createdAt')}

- - - - - - - - - - -`);
}