import mongoose from 'mongoose';

const exerciseSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  exercise_name: {
    type: String,
    required: true
  },
  reps_performed: {
    type: Number,
    required: true
  },
  reps_performed_perfect: {
    type: Number,
    required: true
  }
}, { timestamps: true });

const Exercise = mongoose.model('Exercise', exerciseSchema);

export default Exercise;
