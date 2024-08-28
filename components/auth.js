const user = require("../models/user");
const OTP = require("../models/OTP");
const optgenerator = require("otp-generator")
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();
exports.sendOTP = async(req,res)=>{
   const{email} = req.body;
   const checkUserPresent = await User.findOne({email});
   if (checkUserPresent) {
    return res.status(401).json({
        sucess:true,
        message:'User already registered'
    })
   }
   try{
    const{email} = req.body;
    const checkUserPresent = await User.findOne({email});
    if (checkUserPresent) {
     return res.status(401).json({
         sucess:true,
         message:'User already registered'
     })

   }
      let otp = optgenerator.generate(6,{
        upperCaseAlphabets:false,
        lowerCaseAlphabets:false,
        specialChars:false
     });
     console.log("otp generated",otp);
     //check uniqueness of otp
     const result = await OTP.findOne({otp:otp});
     while(result) {
        otp = optgenerator(6,{
            upperCaseAlphabets:false,
            lowerCaseAlphabets:false,
            specialChars:false
         });
         result = await OTP.findOne({otp:otp});
        
     }
     const otpPayload = {email,otp};
     const otpBody = await OTP.create(otpPayload);
     console.log(otpBody);
     res.status(200).json({
        sucess:true,
        message:'otp send successfull',
        otp,
     })


}
   catch(error){ 
    console.log(error);
    return res.status(500).json({
        sucess:false,
        message:error.message,
    })
      
   }
};
//signup


exports.signUp = async (req,res)=>{
    try{

    
    const {
        firstName,
        lastName,
        email,
        password,
        confirmPassword,
        contactNumber,
        otp
    } = req.body
    if(!firstName||!lastName||!email||!password||!confirmPassword||! otp){
        return res.status(403).json({
            sucess:false,
            message:'All fields are required'
        })
    }
    //2 password match karna hai

        if (password !==confirmPassword) {
            return res.status(400).json({
                sucess:false,
                message:'password and confirm password value does not match,please try again'
            });
        }
        const exisitngUser = await User.findOne({email});
        if (exisitngUser) {
            return res.status(400).json({
                sucess:false,
                message:'User already registered',
            });
        }
        const recentOtp = await OTP.findOne({email}).sort({createdAt:-1}).limit(1);
        console.log(recentOtp);
        if (recentOtp.length ==0) {
            return res.status (400).json({
                sucess:false,
                message:'OTP found'
            })
            
        }else if(otp!==recentOtp.otp){
             return res.status(400).json({
                sucess:false,
                message:'invalid opt'
             });
        }
        const hashedPassword = await bcrypt.hash(password,10);
        //entry in db
        const profileDetails = await Profile.create({
            gender:null,
            dateOfBirth:null,
            about:null,
            contactNumber:null,
        })
        const user = await User.create({
            firstName,
            lastName,
            email,
            password:hashedPassword,
            accountType,
            additionalDetails:profileDetails._id,
            image:  "https://api.dicebear.com/5.x/initials/svg?seed=${firstname} ${lastName}",
        })
        return res.status(200).json({
            sucess:true,
            message:`user is registered successfully`,
            user,
        })
    }
        catch(error){  
            console.log(error);
            return res.status(500).json({
                sucess:false,
                message:"User cannot be registered .please try again"
            })


        }
    }
    //login
    exports.login = async (req,res)=>{
     try{
        //get data from req body 
        const {email,password}=req.body;
        //validation data
        if (!email || !password ) {
            return res.status(403).json({
                sucess:false,
                message:`All fields are required to filled please try again`,
            });
        }
        //check user is registerd
        const user = await user.findOne({email}).populate("additionalDetails");
        if (!user) {
            return res.status(401).json({
                sucess:false,
                message:`User is not registered,please signup first`,
            })
        }
        //generate jwt,after matching password
        if(await bcrypt.compare(password,user.password)){
            const payload = {
                email: user.email,
                id: user._id    ,
                account :user.accountType,

            }
            const token = jwt.sign(payload,process.env.JWT_SECRET,{
                expiresIn:"2h",
            });

            user.token = token;
            user.password = undefined;
            const options ={
                expires:new Date(Date.now()+3*24*60*60*1000),
                httpOnly:true,
            }
            res.cookie("token",token,options).status(200).json({
                success:true,
                token,
                user,
                message:`Logged in successfully`,

            })
        }
        else{
            return res.status(401).json({
                success:false,
                message:`Password is incorrect`,
            })
        }



     } catch(error){
        console.log(error);
        return res.status(500).json({
            success:false,
            message:`login failed ,please try agian`,
        });
     }
    };
    exports.changePassword = async (req, res) => {
        try {
          // Get user data from req.user
          const userDetails = await User.findById(req.user.id)
      
          // Get old password, new password, and confirm new password from req.body
          const { oldPassword, newPassword } = req.body
      
          // Validate old password
          const isPasswordMatch = await bcrypt.compare(
            oldPassword,
            userDetails.password
          )
          if (!isPasswordMatch) {
            // If old password does not match, return a 401 (Unauthorized) error
            return res
              .status(401)
              .json({ success: false, message: "The password is incorrect" })
          }
      
          // Update password
          const encryptedPassword = await bcrypt.hash(newPassword, 10)
          const updatedUserDetails = await User.findByIdAndUpdate(
            req.user.id,
            { password: encryptedPassword },
            { new: true }
          )
      
          // Send notification email
          try {
            const emailResponse = await mailSender(
              updatedUserDetails.email,
              "Password for your account has been updated",
              passwordUpdated(
                updatedUserDetails.email,
                `Password updated successfully for ${updatedUserDetails.firstName} ${updatedUserDetails.lastName}`
              )
            )
            console.log("Email sent successfully:", emailResponse.response)
          } catch (error) {
            // If there's an error sending the email, log the error and return a 500 (Internal Server Error) error
            console.error("Error occurred while sending email:", error)
            return res.status(500).json({
              success: false,
              message: "Error occurred while sending email",
              error: error.message,
            })
          }
      
          // Return success response
          return res
            .status(200)
            .json({ success: true, message: "Password updated successfully" })
        } catch (error) {
          // If there's an error updating the password, log the error and return a 500 (Internal Server Error) error
          console.error("Error occurred while updating password:", error)
          return res.status(500).json({
            success: false,
            message: "Error occurred while updating password",
            error: error.message,
          })
        }
      }