import Onboarding from "../models/onBoarding.model.js";
import { User } from "../models/user.model.js";
import { onboardingSchema } from "../validators/onBoarding.validation.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const saveOnboarding = asyncHandler(async (req, res, next) => {
  // Validate input
  const { error, value } = onboardingSchema.validate(req.body);

  console.log("Onboarding data received:", value);

  if (error) {
    throw new ApiError(400, error.details[0].message);
  }

  // Save onboarding data
  const onboardingData = await Onboarding.create(value);

  // Send success response
  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        onboardingData,
        "Onboarding data saved successfully."
      )
    );
});

const findOnboardingByEmail = asyncHandler(async (req, res) => {
  const { email } = req.body;
  console.log("getUserByEmail email:", email);
  if (!email) {
    throw new ApiError(400, "Email is required");
  }
  const user = await User.findOne({ email }).select("-password -refreshToken").populate("onboarding");
    console.log("user", user);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const onBoarding = await Onboarding.findOne({_id:user.onboarding._id});
  console.log("onBoarding", onBoarding);

    if (!onBoarding) {
        throw new ApiError(404, "Onboarding data not found for this user");
    }
    return res.status(200).json(
        new ApiResponse(200, onBoarding, "Onboarding data fetched successfully.")
    );
});




export { saveOnboarding , findOnboardingByEmail };
