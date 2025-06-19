import express from 'express';
import { createDIY } from '../controllers/diy.controller.js';

const router = express.Router();

// Create DIY plan
router.post('/save', createDIY);

export default router;
