import mongoose from "mongoose";

const premiumSchema = new mongoose.Schema(
  {
    user : {
        type : mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    active : {
        
    planType : {
        type: String,
        enum: ["monthly", "yearly"],
        required: true,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {type: Boolean,
        default: false,
    },
      type: Date,
      required: true,
    },
    lastPayment : {
        type : mongoose.Schema.Types.ObjectId,
        ref: "Payment",
    }

  },
  {
    timestamps: true,
  }
);

export const Premium = mongoose.model("Premium",premiumSchema);
