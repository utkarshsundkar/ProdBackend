import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Diet } from "../models/diet.models.js";
import { User } from "../models/user.model.js";
import mongoose from "mongoose";

const dietRegister = asyncHandler(async (req, res) => {
  const { dietType, fitnessGoal } = req.body;
  // console.log({dietType , fitnessGoal})

  if (!dietType || !fitnessGoal) {
    throw new ApiError(400, "Diet type and fitness goal are required");
  }
  

  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user?._id),
      },
    },
  ]);

  if (!user) {
    throw new ApiError(404, "User not found");
  }
  
  const existingDiet = await Diet.findOne({ owner: req.user?._id });

  // console.log(existingDiet)

  if (existingDiet) {
    throw new ApiError(
      400,
      "You already have an active diet. Update it instead."
    );
  }

  const diet = await Diet.create({
    owner: user[0]?._id,
    dietType,
    fitnessGoal,
  });
  if (!diet) {
    throw new ApiError(400, "diet controller is not created");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, diet, "diet added Successfully"));
});

const getCurrentDiet = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  // console.log(userId)

  if (!userId) {
    throw new ApiError(500, "user id not found");
  }

  const diet = {};
  diet.owner = userId;

  const userDiet = await Diet.find(diet);

  // console.log(diet)
  // console.log(userDiet)

  return res
    .status(200)
    .json(new ApiResponse(200, userDiet, "diet fetched successfully"));
});

const dietupdate = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const {dietType, fitnessGoal} = req.body;

  if (!dietType || !fitnessGoal) {
    throw new ApiError(500, "new diet type and new fitness goal is required");
  }

  const oldDiet = await Diet.findOne({ owner: userId});

  // console.log("old diet : ",oldDiet._id)

  // console.log({dietType,fitnessGoal})

  const updatedDiet = await Diet.findByIdAndUpdate(
    {
      _id: oldDiet._id,
    },
    {
      dietType,
      fitnessGoal
    },
    {
      new: true,
      runValidators: true,
    }
  );

  console.log(updatedDiet)

  if (!updatedDiet) {
    throw new ApiError(404, "updated diet not found");
  }

  return res.status(200).json(new ApiResponse(200, updatedDiet, "diet updated"));

});

export { dietRegister, getCurrentDiet, dietupdate };
