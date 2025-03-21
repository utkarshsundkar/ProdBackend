import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { dietRegister , getCurrentDiet , dietupdate } from "../controllers/diet.controller.js";

const router = Router();

router.route('/dietRegister').post(verifyJWT,dietRegister)
router.route('/CurrentDiet/:userId').get(verifyJWT,getCurrentDiet)
router.route('/updateDiet/:userId').patch(verifyJWT,dietupdate)

export default router