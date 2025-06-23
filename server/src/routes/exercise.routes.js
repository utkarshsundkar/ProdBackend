import express from 'express';
import { saveExercise, saveFocusExercise } from '../controllers/exercise.controller.js';

const router = express.Router();

// POST route to save exercise
router.post('/save', saveExercise);
router.post('/saveFocus', saveFocusExercise);

export default router;
