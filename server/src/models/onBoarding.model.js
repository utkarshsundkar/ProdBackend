import mongoose from 'mongoose';
import Diet from './diet.model.js'; 

const onboardingSchema = new mongoose.Schema(
    {
          userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
        dob: {
            type: Date,
            required: true
        },
        height: {
            type: Number, // Assuming height in cm or inches
            required: true,
    min: [50, 'Height must be at least 50 cm'],
    max: [300, 'Height cannot exceed 300 cm']
        },
        weight: {
            type: Number, // Assuming weight in kg or lbs
            required: true,
            min: [30, 'Weight must be at least 30 kg'],
            max: [500, 'Weight cannot exceed 500 kg']
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

// Automatically create initial diet after onboarding
onboardingSchema.post('save', async function (doc) {
  try {

      // Create initial diet with zero values
      const initialDiet = new Diet({
        userId: doc.userId,
        primaryGoal: doc.primaryGoal,
        calorie: 0,
        protein: 0,
        carbs: 0,
        fats: 0
      });
      
      await initialDiet.save();
      
      // ✅ Push the diet ID into the user's diet array
      await mongoose.model('User').findByIdAndUpdate(
        doc.user,
        { $push: { diet: initialDiet._id } }, // Push instead of set
        { new: true }
      );
    
  } catch (error) {
    console.error('Error creating initial diet:', error);
  }
});

const Onboarding = mongoose.model('Onboarding', onboardingSchema);
export default  Onboarding ;
