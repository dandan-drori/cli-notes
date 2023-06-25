#!/usr/bin/env ts-node

import express, { Application } from 'express';
import cors from 'cors';
import { router as notesRouter } from './server/routes/notes';
import { router as settingsRouter } from './server/routes/settings';
import { router as tagsRouter } from './server/routes/tags';
import { router as trashRouter } from './server/routes/trash';

const PORT = process.env.PORT || 3000;

const app: Application = express();
app.use(cors());
app.use(express.json());

app.use('/notes', notesRouter);
app.use('/settings', settingsRouter);
app.use('/tags', tagsRouter);
app.use('/trash', trashRouter);

app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});