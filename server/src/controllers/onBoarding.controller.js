import  Onboarding  from '../models/onBoarding.model.js';
import { onboardingSchema } from '../validators/onBoarding.validation.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const saveOnboarding = asyncHandler(async (req, res, next) => {
    // Validate input
    const { error, value } = onboardingSchema.validate(req.body);

    if (error) {
        throw new ApiError(400, error.details[0].message);
    }

    // Save onboarding data
    const onboardingData = await Onboarding.create(value);

    // Send success response
    return res.status(201).json(
        new ApiResponse(201, onboardingData, 'Onboarding data saved successfully.')
    );
});

export { saveOnboarding };
