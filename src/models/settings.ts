import { ObjectId } from "mongodb";

export interface Settings {
    _id: ObjectId;
    sortBy: 'createdAt' | 'title' | 'text',
    sortDirection: 'desc' | 'asc',
}