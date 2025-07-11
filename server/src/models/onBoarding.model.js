import mongoose from "mongoose";
import { User } from "./user.model.js"; // Assuming you have a User model
const onboardingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    age: {
      type: Number,
      required: true,
    },
    height: {
      type: Number, // Assuming height in cm or inches
      required: true,
      min: [50, "Height must be at least 50 cm"],
      max: [300, "Height cannot exceed 300 cm"],
    },
    weight: {
      type: Number, // Assuming weight in kg or lbs
      required: true,
      min: [30, "Weight must be at least 30 kg"],
      max: [500, "Weight cannot exceed 500 kg"],
    },
    gender: {
      type: String,
      required: true,
      enum: ["Male", "Female"],
    },
    primaryGoal: {
      type: String,
      required: true,
      enum: ["weight loss", "muscle gain", "maintain"],
    },
    workoutFrequency: {
      type: String, // Number of days per week, etc.
      required: true,
    },
    currentFitnessLevel: {
      type: String,
      required: true,
      enum: ["beginner", "intermediate", "advanced"],
    },
    dailyActivityLevel: {
      type: String,
      required: true,
      enum: ["Low", "Moderate", "High"],
    },
    securityQuestions: {
      type: String,
      required: true,
      enum: [
        "What is your mother's maiden name?",
        "What was the name of your first pet?",
        "What was the name of your elementary school?",
        "What is your favorite food?",
      ],
    },

    securityQuestionsAnswer: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

onboardingSchema.post("save", async function (doc, next) {
  try {
    await User.findByIdAndUpdate(doc.userId, {
      $set: { onboarding: doc._id },
    });
    next();
  } catch (error) {
    console.error("Error updating user onboarding field:", error);
    next(error);
  }
});

const Onboarding = mongoose.model("Onboarding", onboardingSchema);
export default Onboarding;
