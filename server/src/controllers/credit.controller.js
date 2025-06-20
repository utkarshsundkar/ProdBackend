import Exercise from '../models/exercise.model.js';
import { User } from '../models/user.model.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const giveNormalCredits = asyncHandler(async (req, res) => {
    const { userId, exercise_name } = req.body;

    if (!userId || !exercise_name) {
        throw new ApiError(400, 'userId and exercise_name are required.');
    }

    // Get today's date range
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // 🔄 Enhanced retry configuration
    const maxRetries = 5;
    let retryCount = 0;
    let lastError = null;

    //Outer loop for retrying the entire credit claim process
    while (retryCount < maxRetries) {
        try {
            // OPTIMIZATION: Use findOneAndUpdate to claim credit atomically
            const exercise = await Exercise.findOneAndUpdate(
                {
                    userId,
                    exercise_name,
                    createdAt: { $gte: startOfDay, $lte: endOfDay },
                    credit_claimed: false
                },
                { $set: { credit_claimed: true } },
                { 
                    sort: { createdAt: -1 },
                    new: true,
                    // 🚨 Critical: Add this option for write conflicts
                    writeConcern: { w: 'majority' } // Ensure write concern is set
                }
            );

            if (!exercise) {
                throw new ApiError(404, 'No eligible exercise found for credit claim.');
            }

            // Update user credits with retry
            let userUpdateSuccess = false;
            let userRetryCount = 0;

            // Inner loop for retrying user credit update
            while (!userUpdateSuccess && userRetryCount < 3) {
                try {
                    const updatedUser = await User.findByIdAndUpdate(
                        userId,
                        { $inc: { credits: exercise.reps_performed_perfect } },
                        { 
                            new: true,
                            // 🚨 Critical: Add this option
                            writeConcern: { w: 'majority' } // Ensure write concern is set
                        }
                    );
                    
                    userUpdateSuccess = true;
                    return res.status(200).json(
                        new ApiResponse(200, updatedUser, `${exercise.reps_performed_perfect} credits added successfully.`)
                    );
                } catch (userError) {
                    if (userError.code === 112) { // WriteConflict
                        userRetryCount++;
                        await new Promise(resolve => setTimeout(resolve, 50 * Math.pow(2, userRetryCount)));
                        continue;
                    }
                    throw userError;
                }
            }

            if (!userUpdateSuccess) {
                // If we failed to update user, revert the exercise claim
                await Exercise.findByIdAndUpdate(exercise._id, { $set: { credit_claimed: false } });
                throw new ApiError(500, 'Failed to update user credits after multiple attempts.');
            }

        } catch (error) {
            // Handle specific error cases
            if (error.code === 112) { // WriteConflict
                retryCount++;
                lastError = error;
                await new Promise(resolve => setTimeout(resolve, 100 * Math.pow(2, retryCount))); // Exponential backoff
                continue;
            }
            
            // For other errors, throw immediately
            if (error instanceof ApiError) throw error;
            
            console.error('Credit Processing Error:', error);
            throw new ApiError(500, 'Internal Server Error while processing credit.');
        }
    }

    // Max retries reached
    console.error('Max retries reached for giveCredits:', lastError);
    throw new ApiError(429, 'System busy processing credits. Please try again in a moment.');
});