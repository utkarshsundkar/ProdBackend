import Lifestyle from '../models/lifeStyle.model.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// Create and Save Lifestyle Entry
const saveLifestyle = asyncHandler(async (req, res) => {
    const { sleep, water, steps } = req.body;

    // Basic field validation
    if (sleep === undefined || water === undefined || steps === undefined) {
        throw new ApiError(400, "All fields (sleep, water, steps) are required");
    }

    const lifestyleEntry = await Lifestyle.create({ sleep, water, steps });

    return res
        .status(201)
        .json(
            new ApiResponse(201, lifestyleEntry, "Lifestyle entry saved successfully")
        );
});

export { saveLifestyle };
