import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
    {
        user : {
            type : mongoose.Types.ObjectId,
            ref: "User",
        },
        orderId : {
            type: String,
            required: true,
        },
        paymentId : {
            type: String,
            required: true,
        },
        amount : {
            type: Number,
            required: true,
        },  
        currency : {
            type: String,
            default : "INR",
            required: true,
        },
        method:{
            type: String,
            enum: ["card", "upi", "netbanking", "wallet"],
            required: true,
        },
        status:{
            type: String,
            enum: ["success", "failed", "pending"],
            default: "pending",
        },
        captured : {
            type: Boolean,
            default: false,
        }
    },
    {
        timestamps: true,
    }
)