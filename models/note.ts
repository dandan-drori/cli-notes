import {ObjectId} from "mongodb";

export interface Note {
    _id?: ObjectId | undefined;
    title: string;
    text: string;
    createdAt: string;
}
