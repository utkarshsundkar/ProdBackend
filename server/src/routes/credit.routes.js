import express from 'express';
import { giveNormalCredits } from '../controllers/credit.controller.js';


const router = express.Router();

// Give credits
router.post('/give', giveNormalCredits);

export default router;