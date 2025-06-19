import Exercise from '../models/exercise.model.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const saveExercise = asyncHandler(async (req, res, next) => {
    const { userId, exercise_name, reps_performed, reps_performed_perfect } = req.body;

    // Basic validation
    if (!exercise_name || reps_performed == null || reps_performed_perfect == null) {
        throw new ApiError(400, "All fields (exercise_name, reps_performed, reps_performed_perfect) are required.");
    }

    // Create and save new exercise
    const newExercise = await Exercise.create({
        userId,
        exercise_name,
        reps_performed,
        reps_performed_perfect
    });

    return res.status(201).json(
        new ApiResponse(201, newExercise, "Exercise saved successfully!")
    );
});

export { saveExercise };
