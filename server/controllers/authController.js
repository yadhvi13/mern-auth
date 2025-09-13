//controllers to control user model, and we will create API endpoint

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import userModel from '../models/userModel.js';
import transporter from '../config/nodemailer.js';
import { json } from 'express';

// Register User
export const register = async(req, res) => {

   const {name, email, password} = req.body;

   if(!name || !email || !password){
    return res.json({success: false, message: 'Missing details'})
   }

  try{
    
    const existingUser = await userModel.findOne({email})
    if(existingUser){
        return res.json({success: false, message: "User already exists"});
    }

    // to encrypt password
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new userModel({name, email, password: hashedPassword});
    
    // save data in database
    await user.save();

    //generate tokens using JWT
    const token = jwt.sign({id: user._id}, process.env.JWT_SECRET, {expiresIn: '7d'});

    res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
        maxAge: 7 * 24 * 60 * 60 *1000,
        // 7 days expired time in milliseconds
    });

    // sending welcome email
    const mailOptions = {
        from: process.env.SENDER_EMAIL,
        to: email,
        subject: 'Welcome to the platform',
        text: `Welcome to the platform. Your account has been created with email id: ${email}`
    }
    await transporter.sendMail(mailOptions);

    return res.json({success: true});


  } catch(error){
      res.json({success: false, message: error.message})
  }

}


export const login = async(req, res) => {
    const {email, password} = req.body;

    if(!email || !password){
        return res.json({success: false, message: 'Email and password are required'})
    }

    try{

      const user = await userModel.findOne({email});
      if(!user){
        return res.json({success: false, message: 'Invalid email'})
      }

      const isMatch = await bcrypt.compare(password, user.password);

      if(!isMatch){
        return res.json({success: false, message: 'Invalid password'})
      }

    //   generate token, if user exist already, to user authentication

    const token = jwt.sign({id: user._id}, process.env.JWT_SECRET, {expiresIn: '7d'});

    res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
        maxAge: 7 * 24 * 60 * 60 *1000
        // 7 days expired time in milliseconds
    });

    return res.json({success: true});


    } catch(error){
        return res.json({success: false, message: error.message});
    }
}

// send verification OTP to the user's email
export const logout = async (req, res) => {
    try{
        res.clearCookie('token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
        })

        return res.json({success: true, message: "Logged Out"});

    } catch(error){
        return res.json({success: false, message: error.message});
    }
}

export const sendVerifyOtp = async(req,res) => {
      try{
         
         const {userId} = req.body;

        //  find user from our database
        const user = await userModel.findById(userId)
        if(user.isAccountVerified){
            return res.json({success:false, message: "Account Already Verified"})
        }
        // to generate OTP
       const otp = String (Math.floor(100000 + Math.random()* 900000));

       user.verifyOtp = otp;
       user.verifyOtpExpireAt = Date.now() + 24 * 60 * 60 * 1000;

    //    save user data in database
       await user.save();

       const mailOption = {
        from: process.env.SENDER_EMAIL,
        to: user.email,
        subject: 'Account Verification OTP',
        text: `Your OTP is ${otp}. Verify your account using this OTP.`
       }

       await transporter.sendMail(mailOption);

       res.json({ success: true, message: 'Verification OTP Sent on Email' });

      } 
      catch(error){
           res.json({success: false, message: error.message});
      }
}

export const verifyEmail = async(req, res) => {
    const {userId, otp} = req.body;

    if(!userId || !otp){
        return res.json({ success: false, message: 'Missing details'});
    }
    try{

       const user = await userModel.findById(userId);

       if(!user){
        return res.json({sucess: false, message: 'User not found'});
       }

       if(user.verifyOtp == '' || user.verifyOtp != otp){
        return res.json({sucess: false, message: 'Invalid OTP'});
       }

       if(user.verifyOtpExpireAt < Date.now()){
        return res.json({success: false, message: 'OTP Expired'});
       }

       user.isAccountVerified = true;
    //    reset OTP state
       user.verifyOtp = '';
       user.verifyOtpExpireAt = 0;

       await user.save();
  
       return res.json({success: true, message: 'Email Verified Successfully'});


    } catch(error){
        return res.json({success: false, message: error.message});
    }
}