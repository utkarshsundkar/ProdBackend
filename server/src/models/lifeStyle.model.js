import mongoose from 'mongoose';

const lifestyleSchema = new mongoose.Schema({
    sleep: {
        type: Number, // Assuming sleep is in hours
        required: true,
    },
    water: {
        type: Number, // Assuming water is in liters
        required: true,
    },
    steps: {
        type: Number, // Number of steps walked
        required: true,
    }
}, { timestamps: true }); // Adds createdAt and updatedAt fields

const Lifestyle = mongoose.model('Lifestyle', lifestyleSchema);

export default Lifestyle;
