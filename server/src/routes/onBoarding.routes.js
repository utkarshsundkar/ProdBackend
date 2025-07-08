import express from 'express';
import { saveOnboarding } from '../controllers/onBoarding.controller.js';
import { findOnboardingByEmail } from '../controllers/onBoarding.controller.js';

const router = express.Router();

router.post('/save', saveOnboarding);
router.post('/find-onboarding-by-email', findOnboardingByEmail);

export default router;
