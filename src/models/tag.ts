import { Note } from './note'
import { ObjectId } from "mongodb";

export interface Tag {
    _id?: ObjectId;
    createdAt: string;
    lastModified: string;
    text: string;
    notes: Note[];
}