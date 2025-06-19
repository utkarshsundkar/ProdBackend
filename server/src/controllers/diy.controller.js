import { DIY } from "../models/diy.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createDIY = asyncHandler(async (req, res, next) => {
    const { day, exercises } = req.body;

    // Validation
    if (!day || !exercises || !Array.isArray(exercises) || exercises.length === 0) {
        throw new ApiError(400, "Day and exercises are required. Exercises must be a non-empty array.");
    }

    // Create and save
    const diy = await DIY.create({ day, exercises });

    // Send success response
    return res.status(201).json(
        new ApiResponse(201, diy, "DIY workout plan created successfully.")
    );
});

export { createDIY };
