import FocusSession from '../models/focusSession.model.js';
import User from '../models/user.model.js';

export const startFocusSession = asyncHandler(async (req, res) => {
    const { userId } = req.body;

    if (!userId) throw new ApiError(400, 'User ID is required.');

    const newSession = await FocusSession.create({ userId });

    // Optionally, add session ID to user
    await User.findByIdAndUpdate(userId, {
        $push: { focusSessions: newSession._id }, // Push to session history
        $set: { currentFocusSession: newSession._id } // Set current session
    });

    return res.status(201).json(new ApiResponse(201, newSession, 'Focus session started.'));
});

//===================================


export const endFocusSession = asyncHandler(async (req, res) => {
    const { userId } = req.body;

    if (!userId ) throw new ApiError(400, 'User ID is required.');

    const user = await User.findById(userId).populate('currentFocusSession');

    if (!user || !user.currentFocusSession) throw new ApiError(404, 'Focus session not found.');

    let creditsToDeduct = 0;

    // Calculate imperfect reps
    user.currentFocusSession.exercises.forEach(exercise => {
        if (exercise.reps_performed > exercise.reps_performed_perfect) {
            creditsToDeduct += (exercise.reps_performed - exercise.reps_performed_perfect);
        }
    });

    // Deduct credits if needed
    if (creditsToDeduct > 0) {
        user.credits -= creditsToDeduct;


    }

    // End the session
    user.currentFocusSession.endTime = new Date();
    user.currentFocusSession.isCompleted = true;
    user.currentFocusSession.creditsDeducted = creditsToDeduct;
    await user.currentFocusSession.save();
    user.currentFocusSession = null;
    await user.save();

   

    return res.status(200).json(new ApiResponse(
        200,
        user.currentFocusSession,
        creditsToDeduct > 0
            ? `${creditsToDeduct} credits deducted due to imperfect focus session.`
            : 'Perfect focus session! No credits deducted.'
    ));
});