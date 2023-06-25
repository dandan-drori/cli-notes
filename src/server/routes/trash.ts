import express from 'express';
import { emptyTrash, getNotesInTrash, restoreNoteFromTrash, getNoteInTrash, permanentlyDeleteNote } from '../controllers/trash';

const router = express.Router();

router.get('/', getNotesInTrash);
router.get('/:noteId', getNoteInTrash);
router.post('/restore', restoreNoteFromTrash);
router.delete('/empty', emptyTrash);
router.delete('/:noteId', permanentlyDeleteNote);

export {
    router
};