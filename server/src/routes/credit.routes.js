import express from 'express';
import { getUserCredits, giveNormalCredits } from '../controllers/credit.controller.js';


const router = express.Router();

// Give credits
router.post('/give', giveNormalCredits);
router.get('/get', getUserCredits);

export default router;