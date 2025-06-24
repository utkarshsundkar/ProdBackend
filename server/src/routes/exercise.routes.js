import express from 'express';
import { getUserExercises, saveExercise, saveFocusExercise } from '../controllers/exercise.controller.js';

const router = express.Router();

// POST route to save exercise
router.post('/save', saveExercise);
router.post('/saveFocus', saveFocusExercise);
router.get('/getAll/:userId', getUserExercises);

export default router;
