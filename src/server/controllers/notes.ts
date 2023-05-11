import { Request, Response } from 'express';
import { getAll, getNoteById, save, moveNoteToTrash as moveNoteToTrashDb } from '../../db/mongo';

export async function getAllNotes(req: Request, res: Response) {
    try {
        const notes = await getAll();
        res.status(200).json(notes);
    } catch(e) {
        console.log('Error: failed to get notes');
        res.status(500).json(e);
    }
}

export async function getNote(req: Request, res: Response) {
    try {
        const { noteId } = req.params;
        const note = await getNoteById(noteId);
        res.status(200).json(note);
    } catch(e) {
        console.log('Error: failed to get note');
        res.status(500).json(e);
    }
}

export async function saveNote(req: Request, res: Response) {
    try {
        const { note } = req.body;
        const result = await save(note);
        res.status(200).json(result);
    } catch(e) {
        console.log('Error: failed to save note');
        res.status(500).json(e);
    }
}

export async function moveNoteToTrash(req: Request, res: Response) {
    try {
        const { note } = req.body;
        const result = await moveNoteToTrashDb(note);
        res.status(200).json(result);
    } catch(e) {
        console.log('Error: failed to delete note');
        res.status(500).json(e);
    }
}