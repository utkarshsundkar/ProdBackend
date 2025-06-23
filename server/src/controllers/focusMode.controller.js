import FocusSession from '../models/focusSession.model.js';
import mongoose from 'mongoose';
import Exercise from '../models/exercise.model.js';
import {User} from '../models/user.model.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

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

    if (!userId) throw new ApiError(400, 'User ID is required.');

    // Start a transaction for atomic operations
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // Get user with populated focus session and exercises
        const user = await User.findById(userId)
            .populate({
                path: 'currentFocusSession',
                populate: {
                    path: 'exercises',
                    model: 'Exercise',
                    select: 'reps_performed reps_performed_perfect' // Only select needed fields
                }
            })
            .session(session);

        if (!user?.currentFocusSession) {
            throw new ApiError(404, 'Focus session not found.');
        }

        const focusSession = user.currentFocusSession;

        // Calculate imperfect reps more efficiently
        const creditsToDeduct = focusSession.exercises.reduce((total, exercise) => {
            const imperfectReps = exercise.reps_performed - exercise.reps_performed_perfect;
            return imperfectReps > 0 ? total + imperfectReps : total;
        }, 0);

        // Update user credits if needed
        if (creditsToDeduct > 0) {
            user.credits -= creditsToDeduct;
        }

        // End the session
        focusSession.endTime = new Date();
        focusSession.isCompleted = true;
        focusSession.creditsDeducted = creditsToDeduct;

        // Clear currentFocusSession reference
        user.currentFocusSession = undefined; // Using undefined is slightly better than null for Mongoose

        // Save both documents in the transaction
        await focusSession.save({ session });
        await user.save({ session });

        await session.commitTransaction();

        return res.status(200).json(new ApiResponse(
            200,
            {
                focusSession,
                remainingCredits: user.credits
            },
            creditsToDeduct > 0
                ? `${creditsToDeduct} credits deducted due to imperfect focus session.`
                : 'Perfect focus session! No credits deducted.'
        ));
    } catch (error) {
        await session.abortTransaction();
        throw error; // This will be caught by asyncHandler
    } finally {
        session.endSession();
    }
});