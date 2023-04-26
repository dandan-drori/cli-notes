import {ObjectId} from "mongodb";

export interface Note {
    _id?: ObjectId;
    password?: string;
    title: string;
    text: string;
    createdAt: string;
    lastModified: string;
    tags: string[],
}