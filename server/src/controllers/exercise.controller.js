import Exercise from '../models/exercise.model.js';
import FocusSession from '../models/focusSession.model.js';
import User from '../models/user.model.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const saveExercise = asyncHandler(async (req, res, next) => {
    const { userId, exercise_name, reps_performed, reps_performed_perfect, isFocused } = req.body;

    // Basic validation
    if (!exercise_name || reps_performed == null || reps_performed_perfect == null) {
        throw new ApiError(400, "All fields (exercise_name, reps_performed, reps_performed_perfect) are required.");
    }

    // Create and save new exercise
    const newExercise = await Exercise.create({
        userId,
        exercise_name,
        reps_performed,
        reps_performed_perfect,
        isFocused: isFocused || false, // Default to false if not provided
    });

    return res.status(201).json(
        new ApiResponse(201, newExercise, "Exercise saved successfully!")
    );
});


//===================


const saveFocusExercise = asyncHandler(async (req, res) => {
    const { userId, exercise_name, reps_performed, reps_performed_perfect} = req.body;
    // Check if user has an active focus session
    let activeFocusSession = null;

   const user = await User.findById(userId).populate('currentFocusSession');

if (!user || !user.currentFocusSession) {
    throw new ApiError(400, "No active focus session found. Please start a focus session first.");
}

 activeFocusSession = user.currentFocusSession;

if (activeFocusSession.isCompleted) {
    throw new ApiError(400, "The focus session has already ended.");
}

// Now you can directly use activeFocusSession._id, activeFocusSession.exercises, etc.

const newExercise = await Exercise.create({
    userId,
        exercise_name,
        reps_performed,
        reps_performed_perfect,
        isFocused: true, // Mark as focused exercise
        focusSessionId: activeFocusSession ? activeFocusSession._id : null
    });

if (activeFocusSession) {
       activeFocusSession.exercises.push(newExercise._id);
await activeFocusSession.save();

    }
  return res.status(201).json(
        new ApiResponse(201, newExercise, "Exercise saved successfully!")
    );
})

export { saveExercise, saveFocusExercise };
