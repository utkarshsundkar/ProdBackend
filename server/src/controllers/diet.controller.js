import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Diet } from "../models/diet.models.js";
import { User } from "../models/user.model.js";
import mongoose from "mongoose";

const dietRegister = asyncHandler(async (req, res) => {
  const { dietType, fitnessGoal } = req.body;
  // console.log({dietType , fitnessGoal})

  if (!(dietType || fitnessGoal)) {
    throw new ApiError(400, "diet type and fitness goal is required");
  }

  // const user = await User.aggregate([
  //   {
  //     $match : {
  //       _id : new mongoose.Types.ObjectId(req.user?._id)
  //     }
  //   }
  // ])

  const user = await User.findById(req.user?._id);
  if (!user) {
    throw new ApiError(404, "User not found");
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

const dietupdate = asyncHandler(async(req,res)=> {
  
})

export { dietRegister };
