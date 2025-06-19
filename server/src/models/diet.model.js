import mongoose from 'mongoose';

const dietSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  primaryGoal: {
    type: String,
    required: true,
    enum: ['Weight Loss', 'Muscle Gain', 'Endurance', 'Maintenance', 'Toning']
  },
  calorie: {
    type: Number,
    required: true,
    min: [0, 'Calories cannot be negative']
  },
  protein: {
    type: Number,
    required: true,
    min: [0, 'Protein cannot be negative']
  },
  carbs: {
    type: Number,
    required: true,
    min: [0, 'Carbs cannot be negative']
  },
  fats: {
    type: Number,
    required: true,
    min: [0, 'Fats cannot be negative']
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for macro percentages
dietSchema.virtual('macroPercentages').get(function() {
  const total = (this.protein * 4) + (this.carbs * 4) + (this.fats * 9);
  return {
    protein: total ? ((this.protein * 4) / total * 100).toFixed(1) : 0,
    carbs: total ? ((this.carbs * 4) / total * 100).toFixed(1) : 0,
    fats: total ? ((this.fats * 9) / total * 100).toFixed(1) : 0
  };
});

const Diet = mongoose.model('Diet', dietSchema);
export default Diet;