import express from 'express';
import { createDiet } from '../controllers/diet.controller.js';


const router = express.Router();

// Create diet plan
router.post('/save', createDiet);

export default router;
