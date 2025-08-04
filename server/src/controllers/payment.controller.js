import { Premium } from "../models/premium.model.js";
import { razorpayInstance } from "../utils/razorpayInstance.js";
import { Payment } from "../models/payment.model.js";
import { PLAN_PRICING } from "../config/planConfig.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import crypto from "crypto";
import { User } from "../models/user.model.js";

const verifyPaymentAndActivate = asyncHandler(async (req, res) => {
    const user = req.user;
    const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        planType,
        paymentId,
        method
    } = req.body

    console.log('🔍 Verifying payment:', {
        razorpay_order_id,
        razorpay_payment_id,
        planType,
        paymentId
    });

    try {
        // Verify Razorpay signature
        const generatedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex")

        console.log('🔍 Generated signature:', generatedSignature);
        console.log('🔍 Received signature:', razorpay_signature);

        if(generatedSignature !== razorpay_signature){
            console.log('❌ Signature mismatch!');
            throw new ApiError(400, "Invalid signature");
        }

        console.log('✅ Signature verified successfully!');
    } catch (error) {
        console.error('❌ Signature verification error:', error);
        throw new ApiError(400, `Signature verification failed: ${error.message}`);
    }

    // Find the payment record by ID
    const paymentUpdate = await Payment.findById(paymentId);

    if (!paymentUpdate) {
        throw new ApiError(404, "Payment not found");
    }

    console.log('🔍 Found payment record:', paymentUpdate);

    // Update payment record with transaction details
    paymentUpdate.razorpayOrderId = razorpay_order_id;
    paymentUpdate.razorpayPaymentId = razorpay_payment_id;
    paymentUpdate.razorpaySignature = razorpay_signature;
    paymentUpdate.paymentMethod = method;
    paymentUpdate.paymentStatus = "success";
    paymentUpdate.paymentDate = new Date();
    await paymentUpdate.save();

    const now = new Date()
    const duration = planType === "monthly" ? PLAN_PRICING.monthly.durationInDays : PLAN_PRICING.yearly.durationInDays;
    const expiryDate = new Date(now.getTime() + duration * 24 * 60 * 60 * 1000);

    // Update user's premium status
    await User.findByIdAndUpdate(user._id, {
        isPremium: true,
        premium: null // We'll set this after creating the Premium record
    });

    const existingPlan = await Premium.findOne({ user: user._id });

    if (existingPlan) {
        existingPlan.active = true;
        existingPlan.planType = planType;
        existingPlan.startDate = now;
        existingPlan.endDate = expiryDate;
        existingPlan.lastPayment = paymentUpdate._id;
        await existingPlan.save();
        
        // Link the existing plan to user
        await User.findByIdAndUpdate(user._id, {
            premium: existingPlan._id
        });
    }
    if(!existingPlan){
        const newPremium = await Premium.create({
            user: user._id,
            active: true,
            planType: planType,
            startDate: now,
            endDate: expiryDate,
            lastPayment: paymentUpdate._id
        });
        
        // Link the new plan to user
        await User.findByIdAndUpdate(user._id, {
            premium: newPremium._id
        });
    }

    console.log('✅ User premium status updated successfully!');

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                success: true,
                payment: paymentUpdate,
                message: "Payment verified and plan activated successfully"
            },
            "Payment verified and plan activated successfully",
        )
    )
})

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

  // Calculate end date based on plan type
  const now = new Date();
  const duration = planType === "monthly" ? PLAN_PRICING.monthly.durationInDays : PLAN_PRICING.yearly.durationInDays;
  const endDate = new Date(now.getTime() + duration * 24 * 60 * 60 * 1000);

  // Create payment record with correct fields
  const newPayment = await Payment.create({
    user: user._id,
    planType: planType,
    endDate: endDate,
    startDate: now,
    active: true
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        success: true,
        order,
        paymentId: newPayment._id,
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

export { getPlan , createOrder, verifyPaymentAndActivate };
