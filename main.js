const express = require('express');
const mongoose = require('mongoose');
const dotenv = require("dotenv");
const app = express();

//creating a scheme for phone number validiation
const validatePhoneNumber = require('validate-phone-number-node-js');

//Creating a scheme for password validiation 
var passwordValidator = require('password-validator');
var schema = new passwordValidator();

// Add properties to it
schema
.is().min(8)                                    // Minimum length 8
.is().max(100)                                  // Maximum length 100
.has().uppercase()                              // Must have uppercase letters
.has().lowercase()                              // Must have lowercase letters
.has().digits(1)                                // Must have at least 1 digits
.is().not().oneOf(['Passw0rd', 'Password123']);


dotenv.config({path:'./config.env'}) ;
require('./db/conn');
app.use(express.json());
app.use(require('./router/auth'));

const User = require('./model/userSchema');
const Item = require('./model/itemSchema');
const PORT = process.env.PORT;


app.listen(PORT,(err)=>{
    if(err){
        console.log(err);
    }else {
        console.log(`Server is running at port no ${PORT}`);
    }
})