import { Request, Response } from 'express';
import { getAllTags as getAllTagsDb, getTagById, removeTag, saveTag } from '../../db/tags';

export async function getAllTags(req: Request, res: Response) {
    try {
        const tags = await getAllTagsDb();
        res.status(200).json(tags);
    } catch(e) {
        console.log('Failed to get tags');
        res.status(500).json(e);
    }
}

export async function getTag(req: Request, res: Response) {
    try {
        const tag = await getTagById(req.params.tagId);
        res.status(200).json(tag);
    } catch(e) {
        console.log('Failed to get tag');
        res.status(500).json(e);
    }
}

export async function save(req: Request, res: Response) {
    try {
        const result = await saveTag(req.body);
        res.status(200).json(result);
    } catch(e) {
        console.log('Failed to save tag');
        res.status(500).json(e);
    }
}

export async function deleteTag(req: Request, res: Response) {
    try {
        const result = await removeTag(req.params.tagId);
        res.status(200).json(result);
    } catch(e) {
        console.log('Failed to delete tag');
        res.status(500).json(e);
    }
}