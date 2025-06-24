import Lifestyle from "../models/lifeStyle.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Create and Save Lifestyle Entry
const saveLifestyle = asyncHandler(async (req, res) => {
  const { userId, sleep, water, steps } = req.body;

  // Basic field validation
  if (sleep === undefined || water === undefined || steps === undefined) {
    throw new ApiError(400, "All fields (sleep, water, steps) are required");
  }

  const lifestyleEntry = await Lifestyle.create({
    userId,
    sleep,
    water,
    steps,
  });

  return res
    .status(201)
    .json(
      new ApiResponse(201, lifestyleEntry, "Lifestyle entry saved successfully")
    );
});

// Get Lifestyle Entry by User ID
const getLifeStyle = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { date } = req.query;

  // Basic validation
  if (!userId) {
    throw new ApiError(400, "User ID is required");
  }

  // Find lifestyle entry by userId
  const lifestyleEntry = await Lifestyle.find({ userId })
  const lifestyleDate = await Lifestyle.findOne({ userId, date });
  if (!lifestyleEntry) {
    throw new ApiError(404, "Lifestyle entry not found for this user");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        lifestyleEntry,
        "Lifestyle entry retrieved successfully"
      )
    );
});

export { saveLifestyle, getLifeStyle };
