import express from 'express';
import { saveExercise } from '../controllers/exercise.controller.js';

const router = express.Router();

// POST route to save exercise
router.post('/save', saveExercise);

export default router;
