import express from 'express';
import { saveLifestyle } from '../controllers/lifeStyle.controller.js';

const router = express.Router();

// Create Lifestyle entry
router.post('/save', saveLifestyle);

export default router;
