// importing all the important libraries
const express = require('express');
const router = express.Router();
const dotenv = require("dotenv");
dotenv.config({path:'./config.env'}) ;

// for taking values front frontend js
const body_parser = require('body-parser');

// for creation of authentication 
const jwt = require("jsonwebtoken");

//creation of a secret key
const secretKey = process.env.SECRETKEY;

// creation of session keys 
const session = require('express-session');

//middleware for serving static file
router.use(express.static('public'));

//Set up EJS as template engine
//router.set('view engine', 'ejs');

// importing cookies library
const cookieParser = require("cookie-parser");
router.use(cookieParser()) ;


//Set up of Session Middleware
router.use(session({
    secret : process.env.SESSIONSECRET ,
    resave : false,
    saveUninitialized : true ,
    cookie : {secure : false}
})) 

//Establishing the connection with the database
require('../db/conn');

//importing user schema
const User = require("../model/userSchema");
//importing item schema
const Item = require("../model/itemSchema");
//importing order schema
const Order = require("../model/ordersSchema");

//creating a scheme for phone number validiation
const validatePhoneNumber = require('validate-phone-number-node-js');

//Creating a scheme for password validiation 
var passwordValidator = require('password-validator');
var schema = new passwordValidator();

//calling encryption for passwords
const bcrypt = require("bcrypt")

// Add properties to it
schema
.is().min(8)                                    // Minimum length 8
.is().max(100)                                  // Maximum length 100
.has().uppercase()                              // Must have uppercase letters
.has().lowercase()                              // Must have lowercase letters
.has().digits(1)                                // Must have at least 1 digits
.is().not().oneOf(['Passw0rd', 'Password123']);

//adding of users to the database 
router.post('/post/add_user',async(req,res)=>{
    
    //calling out the parameters from the post reqenst from postman
    const User_ID = (req.body.User_ID).toLowerCase();
    const User_Name = (req.body.User_Name).toLowerCase();
    const User_Password = req.body.User_Password;
    const User_Mobile_Number = req.body.User_Mobile_Number;
    const User_Email = req.body.User_Email;

    // check if user id is not null
    if (User_ID === ""){
        return res.status(400).json({error: "User Id cannot be null"}) ;
    }

    //check is the user name is not null
    else if (User_Name === ""){
        return res.status(400).json({error: "User Name cannot be null"}) ;
    }
    //check is the password is not null
    else if (User_Password === ""){
        return res.status(400).json({error: "User Password cannot be null"}) ;
    }
    //check is the mobile number is not null
    else if (User_Mobile_Number === ""){
        return res.status(400).json({error: "User Mobile Number cannot be null"}) ;
    }
    //check is the user email is not null
    else if (User_Email === ""){
        return res.status(400).json({error: "User Email cannot be null"}) ;
    }

    //checking if the user email and user id are unique
    User.findOne({$or:[{user_email:User_Email} , {user_id : User_ID}]})
        .then((userExist)=>{
            // error if same user id or user name
            if(userExist){
                return res.status(422).json({error : "Email/ID already exist"});
            }
            //checking for password pattern
            if(!schema.validate(User_Password)){
                return res.status(422).json({error : "Password pattern does not match"});
            }
            //checking for password pattern 
            const result = validatePhoneNumber.validate(User_Mobile_Number);
            if(!result){
                return res.status(422).json({error : "Phone Number pattern does not match"});
            }

            //encrypting the password and storing it in database
            bcrypt.genSalt(10, function await(err, Salt) {
                // The bcrypt is used for encrypting password.
                bcrypt.hash(User_Password, Salt, function (err, hash) {
                    if (err) {
                        return res.status(422).json({error : "Cannot encrypt"});
                    }
                    //saving of user data 
                    const user = new User({user_id:User_ID,user_name:User_Name,user_password:hash,mobile_number:User_Mobile_Number,user_email:User_Email});
                        user.save().then(() =>{
                            return res.status(201).json({message:"User Registered Successfully"}) ; // registed successfully
                        }).catch((err) => res.status(500).json({error:err})) ;
                });
            });
        }).catch(err=>{console.log(err);});
});


// loads all the products available 
router.get("/home",async(req,res) => {
    const items = await Item.find(); // listing all the items present in the table
    const itemJson = items.map(item => item.toJSON()); // mapping all the items in a json format
    return res.json(itemJson);
})

// clear items from the cart with token verification
router.get('/get/clear_cart',verifyToken,(req,res)=>{
    req.session.cart = [] ;
    return res.redirect("/home");
})

//view the cart 
router.get('/post/view_cart',verifyToken,(req,res)=>{
    if(req.session.cart){
        return res.send(JSON.parse(JSON.stringify(req.session.cart))) ;
    }
    else{
        return res.status(400).json({error: "Cart is empty"}) ;
    }         
})  

// add items to the cart with token verification
router.post('/post/add_cart',verifyToken,async(req,res)=>{

    // creating a new cart if not exist
    if(!req.session.cart){
        req.session.cart = []
    }

    // fetching the details of items for the database
    const item_id = (req.body.item_id).toLowerCase() ;
    let item_name
    let item_cost 
    
    // validiating the item_id passed
    const item = await Item.findOne({item_id:item_id});
    if(item){
        item_name = item.item_name ; // corrosponding item name to the given id
        item_cost = item.item_cost ; // corrosponding item cost to the given id
        item_type = item.item_type ; // corrosponding item type to the given id
        let count = 0 ;

        // increasing the quantity of item if present in cart
        for(let i =0 ; i<req.session.cart.length ; i++)
        {
            if(req.session.cart[i].item_id === item_id){
                req.session.cart[i].quantity += 1;
                count ++;
            }
        }

        // adding a new item to the cart
        if(count === 0)
        {
            const cart_data = {
                item_id : item_id,
                item_name : item_name,
                item_cost : parseFloat(item_cost),
                item_type : item_type,
                quantity : 1
            };
            req.session.cart.push(cart_data);
        }

        return res.redirect("/post/view_cart") ;
    }
    else{
        return res.status(400).json({error: "Item_Id does not exist in table"}) ;
    }
})

// remove items from the cart with token verification
router.get('/post/remove_item',verifyToken,(req,res)=>{
    const item_id = req.body.item_id ;

    // removing the given item id from the cart
    for(let i = 0 ; i<req.session.cart.length ; i++)
    {
        if(req.session.cart[i].item_id === item_id)
        {
            req.session.cart.splice(i,1);
        }
    }
    return res.redirect("/post/view_cart") ;
});

//generate the total bill with token verification
router.get('/get/total_bill',verifyToken,(req,res)=>{

    //checking if the session cart exists or not
    if(req.session.cart){

        // creating a new session for billing
        req.session.bill=[]
        let Total_Price = 0 ;
        for(let i = 0 ; i<req.session.cart.length ; i++)
        {
            // initializing all the values
            let tax_charged = 0 ;
            let bill_data ;
            let cart_detail = req.session.cart[i] ;

            //calculation of taxes for product
            if(cart_detail.item_type ===  "product"){
                // base tax for product
                tax_charged = 200 ;

                // charging the taxes according to the condition
                if(cart_detail.item_cost > 1000 && cart_detail.item_cost<=5000 ){
                    tax_charged = cart_detail.item_cost * (0.12);
                }
                else if (cart_detail.item_cost > 5000 ){
                    tax_charged = cart_detail.item_cost * (0.18);
                };  

                // creating a template for storing the bill data 
                bill_data = {
                    Id : cart_detail.item_id ,
                    Name : cart_detail.item_name ,
                    Price : parseFloat(cart_detail.item_cost) ,
                    Type : "product" ,
                    Tax : tax_charged , 
                    Quantity : cart_detail.quantity ,
                    Total_Price_Item : cart_detail.quantity * (cart_detail.item_cost+tax_charged)
                };
            }

            //calculation of taxes for service 
            else {
                // base tax for service
                tax_charged = 100 ;

                // charging the taxes according to the condition
                if(cart_detail.item_cost > 1000 && cart_detail.item_cost<=8000 ){
                    tax_charged = cart_detail.item_cost * (0.10);
                }
                else if (cart_detail.item_cost > 8000 ){
                    tax_charged = cart_detail.item_cost * (0.15);
                };   

                // creating a template for storing the bill data 
                bill_data = {
                    Id : cart_detail.item_id ,
                    Name : cart_detail.item_name ,
                    Price : parseFloat(cart_detail.item_cost) ,
                    Type : "service" ,
                    Tax : tax_charged , 
                    Quantity : cart_detail.quantity ,
                    Total_Price_Item : cart_detail.quantity * (cart_detail.item_cost+tax_charged)
                };
            }   
            
            // calculating the total price
            Total_Price += cart_detail.quantity * (cart_detail.item_cost+tax_charged) ;
            
            // adding each items billing data to the bill session
            req.session.bill.push(bill_data);
        }

        const total_amount = {
            Total_Amount : Total_Price 
        }
        req.session.bill.push(total_amount);
        return res.send(JSON.parse(JSON.stringify(req.session.bill))) ;
    }

    // if the cart has not been created yet
    else {
        return res.status(400).json({error: "No values added to Cart"}) ;
    }
})

//confirm the bill with token verification
router.get('/get/confirm_order',verifyToken,(req,res)=>{
    // checking if the bill session is made or not
    if(req.session.bill){
        // updating the current time and date of the transaction
        let date_transaction = new Date();
        let order ;
        for(let i = 0 ; i<req.session.bill.length-1 ; i++){
            let bill_detail = req.session.bill[i];
            // updating the values in the orders database
            order = new Order({item_id:bill_detail.Id , item_name:bill_detail.Name , item_type:bill_detail.Type , item_cost:bill_detail.Price , item_tax:bill_detail.Tax , item_quantity:bill_detail.Quantity ,item_total_amt:bill_detail.Total_Price_Item,time_purchase:date_transaction});
        }

        order.save().then(() =>{
            return res.status(201).json({message:"Order Confirmed Successfully"}) ; // order confirmed
        }).catch((err) =>{return res.status(500).json({error:err})}) ;
        
        // removing all the elements from cart and from the bill
        req.session.bill=[] ;
        req.session.cart = [] ;
    }

    // if the bill session is not made then redirection to /total_bill
    else{
        return res.redirect("/get/total_bill") ;
    }
})

//for logging in the user
router.post("/login", async(req,res)=>{
    // collecting the username and password using restapi
    const user_email = (req.body.user_email).toLowerCase() ;
    const user_pass = req.body.user_pass ;
    
    let user_db_password ; // refers to password saved in the database
    let user_db_id ; // refers to the id saved in the database

    // checking if the email id is correct
    const user = await User.findOne({user_email:user_email});
    if(user){
        //getting the passwords
        user_db_password = user.user_password ;
        user_db_id = user.user_id ;

        //checking if the password is correct
        const isMatch = await bcrypt.compare(user_pass,user_db_password);
        if(!isMatch) {
            return res.status(400).json({error: "Invalid Password"}) ;
        }

        // creating a token for access of the application , time limit 5min
        else {
            jwt.sign({ user_db_id },secretKey,{expiresIn:'300s'},async(err1,token)=>{
                if(err1){
                    console.log(err1) ;

                }else{
                    res.cookie("jwtoken",token,{
                        expires: new Date(Date.now() + 300000),
                        httpOnly:true
                    });
                    return res.json({message : "User Login Successfully"});
                }
            })
        }    
    }else {
        return res.json({message : "User Email not Registered"});
    }
})

//function to verify the token
function verifyToken(req,res,next){
    const token = req.cookies.jwtoken ;
    if(typeof token !== "undefined"){
        const verifyUser = jwt.verify(token,secretKey) ;
        next() ;
    }else{
        res.status(400).json({error: "Token is not valid"}) ;
    }
}

module.exports = router ;
