import dotenv from 'dotenv';
dotenv.config();
import { getDb } from './db';
import { Note } from "../models/note";
import {ObjectId} from "mongodb";

async function getAll() {
  const db = await getDb();
  const col = await db.collection(process.env.NOTES_COL_NAME as string);
  return col.find({}).toArray();
}

async function getNoteById(noteId: string) {
  const db = await getDb();
  const col = await db.collection(process.env.NOTES_COL_NAME as string);
  return col.findOne({ _id: new ObjectId(noteId) });
}

async function insertOne(note: Note) {
  const db = await getDb();
  const col = await db.collection(process.env.NOTES_COL_NAME as string);
  return col.insertOne(note);
}

async function update(note: Note) {
  const noteToSave = {
    _id: new ObjectId(note._id),
    ...note
  }
  const db = await getDb();
  const col = await db.collection(process.env.NOTES_COL_NAME as string);
  return col.findOneAndUpdate({ _id: noteToSave._id }, { $set: noteToSave });
}

async function save(note: Note) {
  if (note._id) {
    return update(note);
  }
  return insertOne(note);
}

async function remove(noteId: string) {
  const db = await getDb();
  const col = await db.collection(process.env.NOTES_COL_NAME as string);
  return col.findOneAndDelete({_id: new ObjectId(noteId)});
}

async function removeByTitle(title: string) {
  const db = await getDb();
  const col = await db.collection(process.env.NOTES_COL_NAME as string);
  return col.findOneAndDelete({title});
}

export {
  getAll,
  save,
  remove,
  removeByTitle,
  getNoteById,
}
