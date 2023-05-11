import express from 'express';
import { emptyTrash, getNotesInTrash, restoreNoteFromTrash } from '../controllers/trash';

const router = express.Router();

router.get('/', getNotesInTrash);
router.post('/restore', restoreNoteFromTrash);
router.post('/empty', emptyTrash);

export {
    router
};