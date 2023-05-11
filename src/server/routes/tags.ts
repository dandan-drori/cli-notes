import express from 'express';
import { deleteTag, getAllTags, getTag, save } from '../controllers/tags';

const router = express.Router();

router.get('/', getAllTags);
router.get('/:tagId', getTag);
router.post('/', save);
router.put('/', save);
router.delete('/:tagId', deleteTag);

export {
    router
};