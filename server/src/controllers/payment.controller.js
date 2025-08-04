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
        method,
        appliedCredits = 0
    } = req.body

    console.log('🔍 Verifying payment:', {
        razorpay_order_id,
        razorpay_payment_id,
        planType,
        paymentId,
        method,
        appliedCredits
    });

    console.log('🔍 User ID:', user._id);
    console.log('🔍 Plan type:', planType);
    console.log('🔍 Available plans:', Object.keys(PLAN_PRICING));
    console.log('🔍 Applied credits:', appliedCredits);

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
        
        // Deduct applied credits from user account
        if (appliedCredits > 0) {
          console.log('🔍 Deducting credits:', appliedCredits, 'from user:', user._id);
          
          // Check if user has enough credits
          const currentUser = await User.findById(user._id);
          if (!currentUser) {
            throw new ApiError(404, "User not found");
          }
          
          if (currentUser.credits < appliedCredits) {
            throw new ApiError(400, `Insufficient credits. You have ${currentUser.credits} credits but trying to use ${appliedCredits} credits.`);
          }
          
          const updatedUser = await User.findByIdAndUpdate(
            user._id,
            { $inc: { credits: -appliedCredits } },
            { new: true }
          );
          
          console.log('✅ Credits deducted successfully. New balance:', updatedUser.credits);
        }
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
    const duration = planType === "starter" ? PLAN_PRICING.starter.durationInDays :
                     planType === "monthly" ? PLAN_PRICING.monthly.durationInDays : 
                     PLAN_PRICING.yearly.durationInDays;
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
  const { planType, appliedCredits = 0 } = req.body;

  console.log('🔍 Creating order for plan type:', planType);
  console.log('🔍 Applied credits:', appliedCredits);
  console.log('🔍 Available plans:', Object.keys(PLAN_PRICING));

  if (!["starter", "monthly", "yearly"].includes(planType)) {
    console.log('❌ Invalid plan type:', planType);
    throw new ApiError(400, "Plan type is required");
  }

  // Check if user is trying to purchase starter plan again
  if (planType === "starter") {
    const existingStarterPlan = await Payment.findOne({
      user: user._id,
      planType: "starter",
      paymentStatus: "success"
    });

    if (existingStarterPlan) {
      console.log('❌ User has already used starter plan');
      throw new ApiError(400, "Starter plan can only be purchased once. Please choose monthly or yearly plan.");
    }
  }

  let amount = PLAN_PRICING[planType].amount;
  
  // Apply credit discount for monthly plan
  if (planType === "monthly" && appliedCredits > 0) {
    const discountPer25Credits = 1000; // ₹10 in paise per 25 credits
    const maxDiscount = 15000; // ₹150 in paise (₹499 - ₹349)
    
    const discount = Math.min((appliedCredits / 25) * discountPer25Credits, maxDiscount);
    amount = Math.max(amount - discount, 34900); // Minimum ₹349 in paise
    
    console.log('🔍 Applied credits:', appliedCredits);
    console.log('🔍 Discount applied:', discount, 'paise');
    console.log('🔍 Final amount:', amount, 'paise');
  }

  console.log('🔍 Plan amount:', amount, 'for plan:', planType);

  const options = {
    amount,
    currency: "INR",
    receipt: `receipt_order_${Math.floor(Math.random() * 1000000)}`,
  };

  console.log('🔍 Razorpay options:', options);

  let order;
  try {
    order = await razorpayInstance.orders.create(options);
    console.log('✅ Order created successfully:', order.id);
  } catch (razorpayError) {
    console.error('❌ Razorpay order creation failed:', razorpayError);
    throw new ApiError(400, `Razorpay order creation failed: ${razorpayError.message}`);
  }

  // Calculate end date based on plan type
  const now = new Date();
  const duration = planType === "starter" ? PLAN_PRICING.starter.durationInDays : 
                   planType === "monthly" ? PLAN_PRICING.monthly.durationInDays : 
                   PLAN_PRICING.yearly.durationInDays;
  const endDate = new Date(now.getTime() + duration * 24 * 60 * 60 * 1000);

  console.log('🔍 Plan duration:', duration, 'days, End date:', endDate);

  // Create payment record with correct fields
  const newPayment = await Payment.create({
    user: user._id,
    planType: planType,
    endDate: endDate,
    startDate: now,
    active: true
  });

  console.log('✅ Payment record created:', newPayment._id);

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

const getUserPlanStatus = asyncHandler(async (req, res) => {
  const user = req.user;

  try {
    // Refresh user data to get latest credits
    const freshUser = await User.findById(user._id);
    if (!freshUser) {
      throw new ApiError(404, "User not found");
    }

    // Check if user has any successful payments
    const successfulPayments = await Payment.find({
      user: freshUser._id,
      paymentStatus: "success"
    }).sort({ createdAt: -1 });

    // Check if user has used starter plan
    const hasUsedStarterPlan = successfulPayments.some(payment => payment.planType === "starter");

    // Get current active premium plan
    const currentPremium = await Premium.findOne({
      user: freshUser._id,
      active: true
    });

    // Check if current plan is expired
    const isPlanExpired = currentPremium ? new Date() > currentPremium.endDate : true;

    // Determine available plans
    const availablePlans = {
      starter: !hasUsedStarterPlan, // Only show if never used
      monthly: true, // Always available
      yearly: true   // Always available
    };

    // Fetch actual user credits from database
    const userCredits = freshUser.credits || 0;
    
    console.log('🔍 User credits fetched:', {
      userId: freshUser._id,
      credits: userCredits,
      username: freshUser.username
    });

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          hasUsedStarterPlan,
          currentPremium,
          isPlanExpired,
          availablePlans,
          successfulPayments: successfulPayments.length,
          userCredits
        },
        "User plan status retrieved successfully"
      )
    );
  } catch (error) {
    console.error('❌ Error getting user plan status:', error);
    throw new ApiError(500, error.message || "Internal Server Error");
  }
});

export { getPlan, createOrder, verifyPaymentAndActivate, getUserPlanStatus };
