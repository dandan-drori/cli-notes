import { ColorNames } from './../colors/colorTypes'
import type { ObjectId } from "mongodb";

export interface Settings {
    _id?: ObjectId | string;
    sortBy: 'createdAt' | 'title' | 'text',
    sortDirection: 'desc' | 'asc',
    searchHighlightColor: ColorNames,
    mainPassword: string,
}