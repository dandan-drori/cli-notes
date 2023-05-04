import { DbClient } from './db';
import { Note } from "../models/note";
import { ObjectId } from "mongodb";
import { hash, compare } from "bcryptjs";

async function getAll(isTrash = false): Promise<Note[]> {
  const colName = isTrash ? 'trash' : 'notes';
  const col = await DbClient.getCollection(colName);
  const result = await col.find({}).toArray();
  if (result) {
    return result as Note[];
  }
  throw new Error('Failed to retrieve notes');
}

async function getNoteById(noteId: string, isTrash = false): Promise<Note> {
  const colName = isTrash ? 'trash' : 'notes';
  const col = await DbClient.getCollection(colName);
  const note = await col.findOne<Note>({ _id: new ObjectId(noteId) });
  if (note) {
    return note as Note;
  }
  throw new Error('Note not found');
}

async function insertOne(note: Note) {
  const col = await DbClient.getCollection();
  return col.insertOne(note);
}

async function update(note: Note): Promise<Note> {
  const noteToSave = {
    _id: new ObjectId(note._id),
    ...note
  }
  const col = await DbClient.getCollection();
  const result = await col.findOneAndUpdate({ _id: noteToSave._id }, { $set: noteToSave });
  if (result.value) {
    return result.value as Note;
  }
  throw new Error('Note not found');
}

async function save(note: Note) {
  if (note._id) {
    return update(note);
  }
  return insertOne(note);
}

async function remove(noteId: string): Promise<Note> {
  const col = await DbClient.getCollection('trash');
  const result = await col.findOneAndDelete({_id: new ObjectId(noteId)});
  if (result.value) {
    return result.value as Note;
  }
  throw new Error('Failed to delete note');
}

async function lockNote(note: Note, password: string, mainPassword?: string) {
  const rounds = 10;
  note.password = mainPassword || await hash(password, rounds);
  return await update(note);
}

async function unlockNote(note: Note, password: string) {
  if (!note.password) return;
  return await compare(password, note.password);
}

async function getHashedPassword(password: string) {
  const rounds = 10;
  return await hash(password, rounds);
}

async function isPasswordMatch(password: string, hashedPassword: string) {
  return await compare(password, hashedPassword);
}

async function removeLockFromNote(note: Note) {
  const col = await DbClient.getCollection();
  return col.findOneAndUpdate({ _id: note._id }, { $unset: {password: ''} });
}

async function getNotesInTrash() {
  const col = await DbClient.getCollection('trash');
  const result = await col.find({}).toArray();
  if (result) {
    return result as Note[];
  }
  throw new Error('Failed to retrieve notes');
}

async function moveNoteToTrash(note: Note): Promise<Note> {
  const notesCol = await DbClient.getCollection();
  const trashCol = await DbClient.getCollection('trash');
  await trashCol.insertOne(note);
  const result = await notesCol.findOneAndDelete({ _id: new ObjectId(note._id) });
  if (result.value) {
    return result.value as Note;
  }
  throw new Error('Note not found');
}

async function restoreNoteFromTrash(note: Note): Promise<Note> {
  const notesCol = await DbClient.getCollection();
  const trashCol = await DbClient.getCollection('trash');
  await notesCol.insertOne(note);
  const result = await trashCol.findOneAndDelete({ _id: new ObjectId(note._id) });
  if (result.value) {
    return result.value as Note;
  }
  throw new Error('Note not found');
}

async function emptyTrash(): Promise<void> {
  const col = await DbClient.getCollection('trash');
  await col.deleteMany({});
}

export {
  getAll,
  save,
  remove,
  getNoteById,
  lockNote,
  unlockNote,
  removeLockFromNote,
  getHashedPassword,
  isPasswordMatch,
  getNotesInTrash,
  moveNoteToTrash,
  restoreNoteFromTrash,
  emptyTrash,
}
