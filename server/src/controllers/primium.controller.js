import {Premium} from '../models/premium.model.js';
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";


const getPlan = async(req , res) => {
    try {
        const userId = req.user._id;
        const plan = await Premium.findOne({ userId }).populate("lastPayment").lean()
        if (!plan) {
            throw new ApiError(404, "Plan not found for this user");
        }

        return res.status(500).json(
            new ApiResponse(200, plan, "Plan fetched successfully")
        )

    } catch (error) {
        throw new ApiError(500, error.message || "Internal Server Error");
    }
}

export {
    getPlan,
}