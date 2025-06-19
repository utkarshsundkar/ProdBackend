import mongoose from 'mongoose';

const onboardingSchema = new mongoose.Schema(
    {
        dob: {
            type: Date,
            required: true
        },
        height: {
            type: Number, // Assuming height in cm or inches
            required: true
        },
        weight: {
            type: Number, // Assuming weight in kg or lbs
            required: true
        },
        primaryGoal: {
            type: String,
            required: true
        },
        workoutFrequency: {
            type: Number, // Number of days per week, etc.
            required: true
        },
        currentFitnessLevel: {
            type: String,
            required: true
        },
        dailyActivityLevel: {
            type: String,
            required: true
        }
    },
    { timestamps: true }
);

const Onboarding = mongoose.model('Onboarding', onboardingSchema);

export { Onboarding };
