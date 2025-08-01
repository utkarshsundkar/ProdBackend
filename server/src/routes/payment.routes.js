import { getPlan , createOrder , verifyPaymentAndActivate } from "../controllers/payment.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { Router } from "express";

const router = Router();

router.route("/getplan").get(verifyJWT, getPlan);
router.route("/createorder").post(verifyJWT, createOrder);
router.route("/verifyPayment").post(verifyJWT, verifyPaymentAndActivate);

export default router;