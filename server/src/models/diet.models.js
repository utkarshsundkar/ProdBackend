import mongoose, { Schema } from "mongoose";

const dietSchema = new Schema(
  {
    dietType: {
      type: String,
      // enum: ["veg", "non-veg", "vegan", "keto"],
      required: true,
    },
    fitnessGoal: {
      type: String,
      // enum: ["lose", "gain"],
      required: true,
    },
    owner : {
      type : mongoose.Schema.Types.ObjectId,
      ref : 'User'
    }
  },
  {
    timestamps: true,
  }
);

export const Diet = mongoose.model("Diet", dietSchema)
