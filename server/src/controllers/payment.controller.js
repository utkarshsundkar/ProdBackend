import { Premium } from "../models/premium.model.js";
import { razorpayInstance } from "../utils/razorpayInstance.js";
import { Payment } from "../models/payment.model.js";
import { PLAN_PRICING } from "../config/planConfig.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const createOrder = asyncHandler(async (req, res) => {
  const user = req.user;
  const { planType } = req.body;

  if (!["monthly", "yearly"].includes(planType)) {
    throw new ApiError(400, "Plan type is required");
  }

  const amount = PLAN_PRICING[planType].amount;

  const options = {
    amount,
    currency: "INR",
    receipt: `receipt_order_${Math.floor(Math.random() * 1000000)}`,
  };

  const order = await razorpayInstance.orders.create(options);

  const newPayment = await Payment.create({
    userId: user._id,
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    method: "pending",
    status: "pending",
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      newPayment,
      {
        success: true,
        order,
        paymentId: newPayment.id,
        razorpayKey: process.env.RAZORPAY_KEY_ID,
      },
      "Order created successfully"
    )
  );
});

const getPlan = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;
    const plan = await Premium.findOne({ userId })
      .populate("lastPayment")
      .lean();
    if (!plan) {
      throw new ApiError(404, "Plan not found for this user");
    }

    return res
      .status(500)
      .json(new ApiResponse(200, plan, "Plan fetched successfully"));
  } catch (error) {
    throw new ApiError(500, error.message || "Internal Server Error");
  }
});

export { getPlan };
