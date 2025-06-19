import mongoose, {Schema} from "mongoose";
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"

const userSchema = new Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true, 
            index: true
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowecase: true,
            trim: true, 
        },
        dob:{
            type: Date,
            required: [true, 'Date of birth is required'] 
        },
        password: {
            type: String,
            required: [true, 'Password is required']
        },
        height : {
            type: Number,
            required: [true, 'Height is required']
        },
        weight : {
            type: Number,
            required: [true, 'Weight is required']
        },
        primaryGoal: {
            type: String,
            required: [true, 'Primary goal is required']
        },
        workoutFrequency: {
            type: Number,
            required: [true, 'Workout frequency is required']
        },
        currentFitnessLevel: {
            type: String,
            required: [true, 'Current fitness level is required']
        },
        dailAvtivityLevel: {
            type: String,
            required: [true, 'Daily activity level is required']
        },
        refreshToken: {
            type: String
        }
    },
    {
        timestamps: true
    }
)

userSchema.pre("save", async function (next) {
    if(!this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password, 10)
    next()
})

userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password, this.password)
}

userSchema.methods.generateAccessToken = function() {
    // console.log("Generating access token for user: ", this.username); 
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullName: this.fullName
        },
        process.env.ACCES_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCES_TOKEN_EXPIRY
        }
    );
}
  

userSchema.methods.generateRefreshToken = function() {
    // console.log("Generating refresh token for user: ", this.username);
    return jwt.sign(
        {
            _id: this._id,
            username: this.username,
            email: this.email
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    );
    
}


export const User = mongoose.model("User", userSchema)