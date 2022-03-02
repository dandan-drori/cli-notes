#!/usr/bin/env ts-node

import inquirer from 'inquirer';
import { access, readFile, writeFile, mkdir, readdir } from 'fs/promises';
import { promisify } from 'util';
import { exec } from 'child_process';
import { homedir } from 'os';
import {getAll, remove, save} from "./mongo";

const execPrm = promisify(exec);

const notesDir = `${homedir()}/.notes`;

export enum Actions {
  list = "LIST",
  create = "CREATE",
  remove = "DELETE",
  update = "UPDATE",
  search = "SEARCH",
}

const ActionsFunctions = {
  [Actions.list]: listNotes,
  [Actions.create]: createNote,
  [Actions.remove]: removeNote,
  [Actions.update]: updateNote,
  [Actions.search]: searchNotes,
}

async function prompt() {
  const questions = [
    {
      type: "list",
      name: "action",
      message: "What would you like to do?",
      choices: [ 
        {
          name: "List all notes",
          value: Actions.list,
        },
        {
          name: "Create a new note",
          value: Actions.create,
        },
        {
          name: "Delete a note",
          value: Actions.remove,
        },
        {
          name: "Update a note",
          value: Actions.update,
        },
        {
          name: "Search notes",
          value: Actions.search,
        },
      ]
    }
  ]
  const answers = await inquirer.prompt(questions)
  ActionsFunctions[answers.action as Actions]();
}

async function getNoteInfo() {
  const questions = [
    {
      type: "input",
      name: "title",
      message: "Note's title?",
      default: "Title",
    },
    {
      type: "input",
      name: "text",
      message: "Note's text?",
      default: "Text",
    },
  ]
  const {title, text} = await inquirer.prompt(questions)
  const createdAt = new Date().toLocaleString();
  return {title, text, createdAt};
}

async function listNotes() {
  try {
    await access(notesDir);
    try {
      const titles = await readdir(notesDir); 
      const notesPrms = titles.map(async (title) => await readFile(`${notesDir}/${title}`));
      const notesBuffers = await Promise.all(notesPrms);
      const notes = notesBuffers.map(noteBuffer => {
        const noteRows = noteBuffer.toString().split('\n');
        const [createdAt, title] = noteRows;
        const textArr = noteRows.slice(2, noteRows.length);
        if (!textArr[textArr.length - 1]) textArr.splice(textArr.length - 1, 1);
        const text = textArr.join('\n');
        return {
          title,
          text,
          createdAt
        };
      });
      console.log(notes);
    } catch (err) {
      console.log('Error: failed to read ~/.notes directory.');
      process.exit(1);
    }
  } catch (e) {
    console.log('Error: failed to locate ~/.notes directory.');
    process.exit(1);
  }
}

async function createNote() {
  try {
    await access(notesDir);
    createNoteWithoutDir();
  } catch (e) {
    try {
      await mkdir(notesDir, { recursive: true });
      createNoteWithoutDir();
    } catch (err) {
      console.log('Error: failed to create notes directory.');
      process.exit(1);
    }
  } 

  async function createNoteWithoutDir() {
    const {title, text, createdAt} = await getNoteInfo();
    try {
      await access(`${notesDir}${title}`);
      console.log('Error: note already exists!');
      process.exit(1);
    } catch (e) {
      try {
        await writeFile(`${notesDir}/${title}`, `${createdAt}\n${title}\n${text}`);
      } catch (err) {
        console.log('Error: failed to create note.');
        process.exit(1);
      }
    } finally {
      console.log('Note created successfully');
      console.log(`  cd ~/.notes/${title}`)
    }
  }
}

async function removeNote() {}
async function updateNote() {}
async function getNote() {}
async function searchNotes() {}

;(async () => {
  // await save({title: 'Test Title', text: 'Test Text', createdAt: new Date().toLocaleString()});
  await remove("621eb36ad57134e339c94a08");
  const res = await getAll();
  console.log(res);
  process.exit(1);
  // await prompt();
})();
