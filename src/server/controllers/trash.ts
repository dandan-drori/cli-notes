import { Request, Response } from 'express';
import { 
    getNotesInTrash as getNotesInTrashDb,
    restoreNoteFromTrash as restoreNoteFromTrashDb,
    emptyTrash as emptyTrashDb,
    remove as permanentlyDeleteNoteDb,
    getNoteById,
} from '../../db/mongo';

export async function getNotesInTrash(req: Request, res: Response): Promise<void> {
    try {
        const notes = await getNotesInTrashDb();
        res.status(200).json(notes);
    } catch(e) {
        console.log('Failed to get notes');
        res.status(500).json(e);
    }
}

export async function getNoteInTrash(req: Request, res: Response): Promise<void> {
    try {
        const note = await getNoteById(req.params?.noteId, true);
        res.status(200).json(note);
    } catch(e) {
        console.log('Failed to get note');
        res.status(500).json(e);
    }
}

export async function restoreNoteFromTrash(req: Request, res: Response): Promise<void> {
    try {
        const { note } = req.body;
        const notes = await restoreNoteFromTrashDb(note);
        res.status(200).json(notes);
    } catch(e) {
        console.log('Failed to restore note');
        res.status(500).json(e);
    }
}

export async function emptyTrash(req: Request, res: Response): Promise<void> {
    try {
        await emptyTrashDb();
        res.status(200).json({ success: true });
    } catch(e) {
        console.log('Failed to empty trash');
        res.status(500).json(e);
    }
}

export async function permanentlyDeleteNote(req: Request, res: Response): Promise<void> {
    try {
        const deletedNote = await permanentlyDeleteNoteDb(req.params?.noteId);
        res.status(200).json(deletedNote);
    } catch(e) {
        console.log('Failed to delete note');
        res.status(500).json(e);
    }
}