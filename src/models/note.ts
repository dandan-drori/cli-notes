import {ObjectId} from "mongodb";

export interface Note {
    _id?: ObjectId | undefined;
    password?: string;
    title: string;
    text: string;
    createdAt: string;
}
