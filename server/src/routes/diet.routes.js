import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { dietRegister } from "../controllers/diet.controller.js";

const router = Router();

router.route('/dietRegister').post(verifyJWT,dietRegister)

export default router