import dotenv from 'dotenv';
dotenv.config();
import { getNotesCollection } from './db';
import { Note } from "../models/note";
import { ObjectId } from "mongodb";
import { hash, compare } from "bcryptjs";

async function getAll() {
  const col = await getNotesCollection();
  return col.find({}).toArray();
}

async function getNoteById(noteId: string) {
  const col = await getNotesCollection();
  return col.findOne({ _id: new ObjectId(noteId) });
}

async function insertOne(note: Note) {
  const col = await getNotesCollection();
  return col.insertOne(note);
}

async function update(note: Note): Promise<Note> {
  const noteToSave = {
    _id: new ObjectId(note._id),
    ...note
  }
  const col = await getNotesCollection();
  return col.findOneAndUpdate({ _id: noteToSave._id }, { $set: noteToSave }) as never as Note;
}

async function save(note: Note) {
  if (note._id) {
    return update(note);
  }
  return insertOne(note);
}

async function remove(noteId: string) {
  const col = await getNotesCollection();
  return col.findOneAndDelete({_id: new ObjectId(noteId)});
}

async function lockNote(note: Note, password: string) {
  const rounds = 10;
  note.password = await hash(password, rounds);
  return await update(note);
}

async function unlockNote(note: Note, password: string) {
  if (!note.password) return;
  return await compare(password, note.password);
}

async function removeLockFromNote(note: Note) {
  const col = await getNotesCollection();
  return col.findOneAndUpdate({ _id: note._id }, { $unset: {password: ''} }) as never as Note;
}

export {
  getAll,
  save,
  remove,
  getNoteById,
  lockNote,
  unlockNote,
  removeLockFromNote,
}
