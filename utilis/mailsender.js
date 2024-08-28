const nodemiler = require("nodemailer");
const mailSender = async(email,title,body)=>{
    try{
        let transporter = nodemiler.createTransport({
            host:process.env.MAIL_HOST,
            auth:{
                user: process.env.MAIL_USER,
                pass:process.env.MAIL_PASS
            }
            
        })
        let info = await transporter.sendMail({
            from:'Webalive|| coder-by Parth',
            to :`${email}`,
            subject:`${title}`,
            html:`${Body}`

        })
           console.log(info);
           return info;
    }
    catch(error){
        console.log(error.message);
    }
}
module.exports= mailSender;