import Diet from '../models/diet.model.js';
import Onboarding from '../models/onBoarding.model.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// Create a new diet entry with primaryGoal from Onboarding
export const createDiet = asyncHandler(async (req, res) => {
    const { userId, calorie, protein, carbs, fats } = req.body;

    // Basic validation
    if (!userId || calorie == null || protein == null || carbs == null || fats == null) {
        throw new ApiError(400, 'All fields (userId, calorie, protein, carbs, fats) are required.');
    }

    // 🔍 Find user's primaryGoal from Onboarding
    const onboardingData = await Onboarding.findOne({ userId });

    if (!onboardingData) {
        throw new ApiError(404, 'Onboarding data not found for this user.');
    }

    const primaryGoal = onboardingData.primaryGoal;

    // Create and save the new diet entry
    const diet = await Diet.create({
        userId,
        primaryGoal,
        calorie,
        protein,
        carbs,
        fats
    });

    // Return success response
    return res.status(201).json(
        new ApiResponse(201, diet, 'Diet saved successfully.')
    );
});

export const getDiet = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    // Basic validation
    if (!userId) {
        throw new ApiError(400, 'User ID is required.');
    }

    // 🔍 Find diet entry by userId
    const diet = await Diet.findOne({ userId });

    if (!diet) {
        throw new ApiError(404, 'Diet not found for this user.');
    }

    // Return success response
    return res.status(200).json(
        new ApiResponse(200, diet, 'Diet retrieved successfully.')
    );
});
