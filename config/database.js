const mongoose = require("mongoose");
require("dotenv").config();
exports.connect = () =>{
    mongoose.connect(process.env.MONGOOSE_URL,{
        usenNewUrlParser:true,
        useUnifiedTopology:true,
    })
    .then(()=> console.log("Db connected successfully"))
    .catch((error)=>{
        console.log("db connnection error");
        console.log(error);
        process.exit(1);
    })
};