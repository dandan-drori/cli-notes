import { Request, Response } from 'express';
import { 
    getNotesInTrash as getNotesInTrashDb,
    restoreNoteFromTrash as restoreNoteFromTrashDb,
    emptyTrash as emptyTrashDb,
} from '../../db/mongo';

export async function getNotesInTrash(req: Request, res: Response) {
    try {
        const notes = await getNotesInTrashDb();
        res.status(200).json(notes);
    } catch(e) {
        console.log('Failed to get notes');
        res.status(500).json(e);
    }
}

export async function restoreNoteFromTrash(req: Request, res: Response) {
    try {
        const notes = await restoreNoteFromTrashDb(req.body);
        res.status(200).json(notes);
    } catch(e) {
        console.log('Failed to restore note');
        res.status(500).json(e);
    }
}

export async function emptyTrash(req: Request, res: Response) {
    try {
        await emptyTrashDb();
        res.status(200).json({ success: true });
    } catch(e) {
        console.log('Failed to empty trash');
        res.status(500).json(e);
    }
}