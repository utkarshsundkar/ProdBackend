import { DIY } from '../models/diy.model.js';
import { User } from '../models/user.model.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const createDIY = asyncHandler(async (req, res) => {
    const { userId, day, exercises } = req.body;

    // Basic validation
    if (!userId || !day || !exercises || exercises.length === 0) {
        throw new ApiError(400, "All fields (userId, day, exercises) are required and exercises cannot be empty.");
    }

    // Upsert Logic: Find if DIY exists for this user and day
    const updatedDIY = await DIY.findOneAndUpdate(
        { userId, day }, // Match by user and day
        { exercises },    // Replace exercises with new ones
        { new: true, upsert: true, setDefaultsOnInsert: true } // Create if not exists
    );
        // Push _id to user's diy array (only if not already present)
    await User.findByIdAndUpdate(userId, {
        $addToSet: { diy: updatedDIY._id } // $addToSet ensures no duplicates
    });


    return res.status(200).json(
        new ApiResponse(200, updatedDIY, "DIY entry saved successfully (updated or created).")
    );
});

