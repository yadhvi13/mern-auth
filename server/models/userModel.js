//creating user model

// import { verify } from "jsonwebtoken";
import mongoose from "mongoose";

//to create user, we need
const userSchema = new mongoose.Schema({
     name: {type: String, required: true},
     email: {type: String, required: true, unique: true},
     password: {type: String, required: true},
     verifyOtp: {type: String, default: ''},
     verifyOtpExpireAt: {type: Number, default: 0},
     isAccountVerified: {type: Boolean, default: false},
     ResetOtp: {type: String, default: ''},
     ResetOtpExpiredAt: {type: Number, default: 0},
})

//using user schema we will add user model
const userModel = mongoose.models.user ||  mongoose.model('user', userSchema)

export default userModel;