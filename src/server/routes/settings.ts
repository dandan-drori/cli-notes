import express from 'express';
import { getSettings, setSettings, updateSettings } from '../controllers/settings';

const router = express.Router();

router.get('/', getSettings);
router.post('/', setSettings);
router.put('/', updateSettings);

export {
    router
};