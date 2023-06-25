import express from 'express';
import { getAllNotes, getNote, moveNoteToTrash, saveNote, unlockNote, lockNote } from '../controllers/notes';

const router = express.Router();

router.get('/', getAllNotes);
router.get('/:noteId', getNote);
router.post('/', saveNote);
router.put('/', saveNote);
router.post('/unlock', unlockNote);
router.post('/lock', lockNote);
router.post('/:noteId', moveNoteToTrash);

export {
    router
};