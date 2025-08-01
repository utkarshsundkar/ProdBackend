import { getPlan } from "../controllers/primium.controller";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { Router } from "express";

const router = Router();

router.route("/getplan").get(verifyJWT, getPlan);

export default router;