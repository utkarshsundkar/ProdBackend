import mongoose from 'mongoose';

const lifestyleSchema = new mongoose.Schema({
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
   sleep: {
  type: Number,
  required: true,
  min: [0, 'Sleep cannot be negative'],
  max: [24, 'Sleep cannot exceed 24 hours']
},
water: {
  type: Number,
  required: true,
  min: [0, 'Water cannot be negative']
},
steps: {
  type: Number,
  required: true,
  min: [0, 'Steps cannot be negative']
}
}, { timestamps: true }); // Adds createdAt and updatedAt fields

const Lifestyle = mongoose.model('Lifestyle', lifestyleSchema);

export default Lifestyle;
