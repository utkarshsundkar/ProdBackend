import express from 'express';
import { saveOnboarding } from '../controllers/onBoarding.controller.js';

const router = express.Router();

router.post('/save', saveOnboarding);

export default router;
