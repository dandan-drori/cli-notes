import express from 'express';
import { getAllNotes, getNote, moveNoteToTrash, saveNote } from '../controllers/notes';

const router = express.Router();

router.get('/', getAllNotes);
router.get('/:noteId', getNote);
router.post('/', saveNote);
router.put('/', saveNote);
router.delete('/:noteId', moveNoteToTrash);

export {
    router
};