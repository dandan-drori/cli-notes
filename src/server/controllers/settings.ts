import { Request, Response } from 'express'
import { 
    getSettings as getSettingsDb, 
    setSettings as setSettingsDb,
    updateSettings as updateSettingsDb,
} from '../../db/settings';

export async function getSettings(req: Request, res: Response) {
    try {
        const settings = await getSettingsDb();
        res.status(200).json(settings);
    } catch(e) {
        console.log('Failed to get settings');
        res.status(500).json(e);
    }
}

export async function setSettings(req: Request, res: Response) {
    try {
        await setSettingsDb();
        res.status(200).json({ success: true });
    } catch(e) {
        console.log('Failed to set settings');
        res.status(500).json(e);
    }
}

export async function updateSettings(req: Request, res: Response) {
    try {
        const settings = await updateSettingsDb(req.body);
        res.status(200).json(settings);
    } catch(e) {
        console.log('Failed to update settings');
        res.status(500).json(e);
    }
}