 const mongoose = require("mongoose")
 const mailsender = require("../utilis/mailsender")
const { type } = require("os");
const send = require("send");
 const OTPSchema = new mongoose.Schema({
    email:{
        type: string,
        require:true
    },
    otp:{
        type:string,
         require:true
    }
 });
 async function sendVerificationEmail (email,otp){
    try {
        const mailResponse = await mailsender(email,"Verification email by webalive",otp);
        console.log("email send successfully ",mailResponse);
    } catch (error) {
        console.log("error occurred while sending mail",error);
        throw error;
    }
 }
 OTPSchema.pre('save',async function (next){
    await sendVerificationEmail(this.email,this.otp);
    next();
 });
 mongoose.exports= mongoose.model('OTP',OTPSchemaS)