// importing all the necessary libraries
const express = require("express");
const mysql = require("mysql");
const dotenv = require("dotenv");
const app = express();

// for taking values front frontend js
const body_parser = require('body-parser');

// for creation of authentication 
const jwt = require("jsonwebtoken")

// creation of session keys 
const session = require('express-session');

//middleware for serving static file
app.use(express.static('public'));

//Set up EJS as template engine
app.set('view engine', 'ejs');

// importing the bcryptjs for encrypting the passwords
const bcrypt = require('bcryptjs');
app.use(express.json())

// importing cookies library
const cookieParser = require("cookie-parser");
app.use(cookieParser()) ;

//creating a scheme for phone number validiation
const validatePhoneNumber = require('validate-phone-number-node-js');

//Creating a scheme for password validiation 
var passwordValidator = require('password-validator');
var schema = new passwordValidator();

//declaration of port
const PORT = process.env.PORTUSER;

// Add properties to it
schema
.is().min(8)                                    // Minimum length 8
.is().max(100)                                  // Maximum length 100
.has().uppercase()                              // Must have uppercase letters
.has().lowercase()                              // Must have lowercase letters
.has().digits(1)                                // Must have at least 1 digits
.is().not().oneOf(['Passw0rd', 'Password123']);

dotenv.config({path:'./config.env'});

// establishing a conenction with mysql
//-->dont access the pssword directly 

const con = mysql.createConnection({
    host:'localhost',
    user:'root',
    password : process.env.MYSQLPASSWORD,
    database : "plotly_task"
})

// checking is the connection is successful
con.connect((err)=>{
    if(err){
        console.log(err)
    }
    else {
        console.log("Connected to the MYSQL Database") 
    }
})

//Set up of Session Middleware
app.use(session({
    secret : process.env.SESSIONSECRET,
    resave : false,
    saveUninitialized : true ,
    cookie : {secure : false}
})) 

// create a route to load the products and also creating a new cart if it does not exist 
app.get("/home",(req,res) => {
    con.query('select * from items_status',(err,result,fields)=>{
        if(err)
        {
            console.log(err)
        }
        // creating a new cart if does not exist
        else{
            if(!req.session.cart)
            {
                req.session.cart = [] ;
            }
            // listing all the available products and services
            res.send(JSON.parse(JSON.stringify(result))) ;
        }
    });
})

// clear items from the cart 
app.get('/get/clear_cart',verifyToken,(req,res)=>{
    req.session.cart = [] ;
    res.redirect("/home");
})


//generate the total bill
app.get('/get/total_bill',verifyToken,(req,res)=>{

    //checking if the session cart exists or not
    if(req.session.cart){
        // creatingg a new session for billing
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
        res.send(JSON.parse(JSON.stringify(req.session.bill))) ;
    }

    // if the cart has not been created yet
    else {
        res.status(400).json({error: "No values added to Carte"}) ;
    }
})


//confirm the bill 
// change the database 
app.get('/get/confirm_order',verifyToken,(req,res)=>{
    // checking if the bill session is made or not
    if(req.session.bill){
        // updating the current time and date of the transaction
        let date_transaction = new Date().toISOString().split('T')[0];
        let time_transaction = new Date().toTimeString().split(' ')[0];
        for(let i = 0 ; i<req.session.bill.length-1 ; i++){
            let bill_detail = req.session.bill[i];

            // updating the values in the orders database
            con.query('insert into orders values(?,?,?,?,?,?,?,?,?)',[bill_detail.Id,bill_detail.Name,bill_detail.Price,bill_detail.Type,bill_detail.Tax,bill_detail.Quantity,bill_detail.Total_Price_Item,time_transaction,date_transaction],(err,result)=>{
                if(err){
                    console.log(err);
                }else {
                    res.json({message : "Success!! Bill Confirmed"});
                }
            })       
        }
        req.session.bill=[]
        req.session.cart = [] ;
    }
    // if the bill session is not made then redirection to /total_bill
    else{
        res.redirect("/get/total_bill")
    }
})


// add items to the cart

app.post('/post/add_cart',verifyToken,(req,res)=>{
    
    console.log(`this is my cookie :${req.cookies.jwtoken}`) ;

    // creating a new cart if not exist
    if(!req.session.cart){
        req.session.cart = []
    }

    // fetching the details of items for the database
    const item_id = (req.body.item_id).toLowerCase() ;

    let item_name
    let item_cost 
    
    // validiating the item_id passed
    con.query('select * from items_status where item_id=?',item_id,(err,result)=>{
        if(err)
        {
            console.log(err)
        }
        else{
            if(result.length==1){
                item_name = result[0].Item_Name ;
                item_cost = result[0].Item_Cost ;

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
                        quantity : 1
                };
                    req.session.cart.push(cart_data);
                }
                res.redirect("/home") ;
            }

            // if in case the item_id does not match with the values present in table 
            else{
                res.status(400).json({error: "Item_Id does not exist in table"}) ;
            }
        }
    })
})
 

// remove items from the cart

app.get('/post/remove_item',verifyToken,(req,res)=>{
    const item_id = req.body.item_id ;

    // removing the given item id from the cart
    for(let i = 0 ; i<req.session.cart.length ; i++)
    {
        if(req.session.cart[i].item_id === item_id)
        {
            req.session.cart.splice(i,1);
        }
    }
    res.redirect("/home") ;
});

//view the cart 
app.get('/post/view_cart',verifyToken,(req,res)=>{
    res.send(JSON.parse(JSON.stringify(req.session.cart))) ;        
})  


//adding of users to the database 
app.post('/post/add_user',(req,res)=>{
    
    //calling out the parameters from the post reqenst from postman
    const User_ID = (req.body.User_ID).toLowerCase()
    const User_Name = (req.body.User_Name).toLowerCase()
    const User_Password = req.body.User_Password
    const User_Mobile_Number = req.body.User_Mobile_Number
    const User_Email = req.body.User_Email

    // check if user id is not null
    if (User_ID === ""){
        res.status(400).json({error: "User Id cannot be null"}) ;
    }
    //check is the user name is not null
    else if (User_Name === ""){
        res.status(400).json({error: "User Name cannot be null"}) ;
    }
    //check is the password is not null
    else if (User_Password === ""){
        res.status(400).json({error: "User Password cannot be null"}) ;
    }
    //check is the mobile number is not null
    else if (User_Mobile_Number === ""){
        res.status(400).json({error: "User Mobile Number cannot be null"}) ;
    }
    //check is the user email is not null
    else if (User_Email === ""){
        res.status(400).json({error: "User Email cannot be null"}) ;
    }

    //checking if user_id and email_id are unique
    else {
        con.query('select * from user_details where User_ID =? or User_Email =?',[User_ID,User_Email],(err,result)=>{
            if(err){
                console.log(err)
            }

            // checking if the email id already exits or the user id 
            else if(result.length >= 1){
                con.query('select * from user_details where User_ID =?',User_ID,(err,result)=>{
                    if(err){
                        console.log(err)
                    }
                    else if(result.length >=1){
                        res.status(400).json({error: "User-Id already exists"}) ;
                    }
                    else{
                        res.status(400).json({error: "Email Address already exists"}) ;
                    }
                })
            }

            else {
                // checking for phone number validity
                const result = validatePhoneNumber.validate(User_Mobile_Number);

                // encryption of password
                if(result){
                    if(schema.validate(User_Password)){
                        bcrypt.genSalt(10, function (err, Salt) {
                            // The bcrypt is used for encrypting password.
                            bcrypt.hash(User_Password, Salt, function (err, hash) {
     
                                if (err) {
                                    return console.log('Cannot encrypt');
                                }

                                // After the encryption the values are added
                                con.query('insert into user_details values(?,?,?,?,?)',[User_ID,User_Name,hash,User_Mobile_Number,User_Email],(err,result)=>{
                                    if(err){
                                        console.log(err);
                                    }else {
                                        res.json({message : "User Updated"});
                                    }
                                })
                            })
                        })
                    }
                    else {
                        res.status(400).json({error: "Password must be between 8-100 long , it must have a lower case , a upper case and a digit"}) ;
                    }
                }
                else{
                    res.status(400).json({error: "Mobile Number should be in the format +919926xxxxxx"}) ;
                }
            }
        })
    }
})

//logging in users and creating tokens for validation
app.post("/login", async(req,res)=>{
    const user_email = (req.body.user_email).toLowerCase() ;
    const user_pass = req.body.user_pass ; 
    con.query('select * from user_details where User_Email=?',user_email,async(err,result)=>{
        if(err)
        {
            console.log(err)
        }
        else{
            //checking if user in database
            if(result.length==1){
                const user_database_pass = result[0].User_Password ;
                const user_name = result[0].User_ID ; 
                const isMatch = await bcrypt.compare(user_pass,user_database_pass);
        
                if(!isMatch) {
                    res.status(400).json({error: "Invalid Password"}) ;
                }else {
                    // creation of token 
                    jwt.sign({ user_name },process.env.SECRETKEY,{expiresIn:'100s'},async(err1,token)=>{
                        if(err1){
                            console.log(err1) ;
                        }else{
                            res.cookie("jwtoken",token,{
                                expires: new Date(Date.now() + 100000),
                                httpOnly:true
                            });
                            res.json({message : "User Login Successfully"});
                        }
                    })
                }
            }else{
                res.status(400).json({error: "User Id does not exist"}) ;
            }
        }
    })
})

// function to verify the token 
function verifyToken(req,res,next){
    const token = req.cookies.jwtoken ;
    if(typeof token !== "undefined"){
        const verifyUser = jwt.verify(token,process.env.SECRETKEY) ;
        console.log(verifyUser);
        next() ;
    }else{
        res.status(400).json({error: "Token is not valid"}) ;
    }
}

app.listen(3000,(err)=>{
    if(err){
        console.log(err)
    }else {
        console.log(`on port 3000`)
    }
})