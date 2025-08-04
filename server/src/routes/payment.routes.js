import { getPlan, createOrder, verifyPaymentAndActivate, getUserPlanStatus } from "../controllers/payment.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { Router } from "express";

const router = Router();

router.route("/getplan").get(verifyJWT, getPlan);
router.route("/createorder").post(verifyJWT, createOrder);
router.route("/verifyPayment").post(verifyJWT, verifyPaymentAndActivate);
router.route("/user-plan-status").get(verifyJWT, getUserPlanStatus);

export default router;