//-->dont access the pssword directly 

const express = require("express")
const mysql = require("mysql")
const app = express()

// for taking values front frontend js
const body_parser = require('body-parser');

// creation of session keys 
const session = require('express-session');

//middleware for serving static file
app.use(express.static('public'));

//Set up EJS as template engine
app.set('view engine', 'ejs');

// importing the bcryptjs for encrypting the passwords
const bcrypt = require('bcryptjs');
app.use(express.json())

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
.is().not().oneOf(['Passw0rd', 'Password123','Password']);

// establishing a conenction with mysql
//-->dont access the pssword directly 

const con = mysql.createConnection({
    host:'localhost',
    user:'root',
    password :"855fc1@NOV25",
    database : "try"
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
    secret : "This_project_is_made_for_plotly" ,
    resave : false,
    saveUninitialized : true ,
    cookie : {secure : false}
})) 

// create a route to load the products
app.get("/home",(req,res) => {
    con.query('select * from current_status_products',(err,result,fields)=>{
        if(err)
        {
            console.log(err)
        }
        else{
            if(!req.session.cart)
            {
                req.session.cart = [] ;
            }
            res.send(JSON.parse(JSON.stringify(result))) ;
        }
    });
})

// clear items from the cart 
app.get('/get/clear_cart',(req,res)=>{
    req.session.cart = [] ;
    res.redirect("/home");
})

//generate the total bill
app.get('/get/total_bill',(req,res)=>{
    
    if(req.session.cart){
        req.session.bill=[]
        for(let i = 0 ; i<req.session.cart.length ; i++)
        {
            let tax_charged = 200 ;
            let cart_detail = req.session.cart[i] ;

            if(cart_detail.product_price > 1000 && cart_detail.product_price<=5000 ){
                tax_charged = cart_detail.product_price * (0.12);
            }
            else if (cart_detail.product_price > 5000 ){
                tax_charged = cart_detail.product_price * (0.18);
            };   

            let bill_data = {
                Id : cart_detail.product_id ,
                Name : cart_detail.product_name ,
                Price : parseFloat(cart_detail.product_price) ,
                Type : "Product" ,
                Tax : tax_charged , 
                Quantity : cart_detail.quantity ,
                Total_Price : cart_detail.quantity * (cart_detail.product_price+tax_charged)
            };
            req.session.bill.push(bill_data);
        }
        

    }
    else {
        res.send("Error 42 : No values added to Cart") ;
    }
})

// add items to the cart
app.post('/post/add_cart',(req,res)=>{
    const product_id = (req.body.product_id).toLowerCase() ;
    const product_name = (req.body.product_name).toLowerCase() ;
    const product_price = req.body.product_price ;
    let tax  = 0 ;
    let count = 0 ;

    for(let i =0 ; i<req.session.cart.length ; i++)
    {
        if(req.session.cart[i].product_id === product_id){
            req.session.cart[i].quantity += 1;
            count ++;
        }
    }

    if(count === 0)
    {
        const cart_data = {
            product_id : product_id,
            product_name : product_name,
            product_price : parseFloat(product_price),
            quantity : 1
        };
        req.session.cart.push(cart_data);
    }
    res.redirect("/home");
});

// remove items from the cart
app.get('/post/remove_item',(req,res)=>{
    const product_id = req.body.product_id ;
    console.log(req.query.product_id)
    for(let i = 0 ; i<req.session.cart.length ; i++)
    {
        console.log(req.session.cart[i].product_id)
        if(req.session.cart[i].product_id === product_id)
        {
            console.log("Yes") ;
            req.session.cart.splice(i,1);
        }
    }
    res.redirect("/home") ;
});

//view the cart 
app.get('/post/view_cart',(req,res)=>{
    res.send(JSON.parse(JSON.stringify(req.session.cart))) ;
});

//adding of services 
app.post('/post/new_services',(req,res)=>{
    const Service_ID = (req.body.Service_ID).toLowerCase() 
    const Service_Name =  (req.body.Service_Name).toLowerCase() 
    const Availability = req.body.Availability
    const Cost = req.body.Cost
    const Description = req.body.Description

    con.query('select * from current_status_services where Service_ID =? or Service_Name =?',[Service_ID,Service_Name],(err,result)=>{
        if(err){
            console.log(err)
        }
        // checking if the Item_ID already exits or the Item_Name or the Barcode
        else if(result.length >= 1){
            con.query('select * from current_status_products where Service_ID =?',Service_ID,(err,result)=>{
                if(err){
                    console.log(err)
                }
                else if(result.length >=1){
                    res.send("Service-ID already exists")
                }
                else{
                    res.send("Service-Name already exists")
                }
            })
        }

        else {
            con.query('insert into current_status_products values(?,?,?,?,?,?)',[Service_ID,Service_Name,Availability,Cost,Description],(err,result)=>{
                if(err)
                {
                    console.log(err)
                }else {
                    //--> update this cmd to save the user back
                    res.send("Service Updated") ;
                }
                
            })
        }
        
    })
});


//adding of products 
app.post('/post/new_product',(req,res)=>{
    const Item_ID = (req.body.Item_ID).toLowerCase() 
    const Item_Name =  (req.body.Item_Name).toLowerCase() 
    const Barcode  = req.body.Barcode
    const Availability = req.body.Availability
    const Cost = req.body.Cost
    const Description = req.body.Description

    con.query('select * from current_status_products where Item_ID =? or Item_Name =? or Barcode =?',[Item_ID,Item_Name,Barcode],(err,result)=>{
        if(err){
            console.log(err)
        }
        // checking if the Item_ID already exits or the Item_Name or the Barcode
        else if(result.length >= 1){
            con.query('select * from current_status_products where Item_ID =?',Item_ID,(err,result)=>{
                if(err){
                    console.log(err)
                }
                else if(result.length >=1){
                    res.send("Item-ID already exists")
                }
                else{
                    con.query('select * from current_status_products where Item_Name =?',Item_Name,(err1,result1)=>{
                        if(err1){
                            console.log(err)
                        }
                        else if(result1.length >=1){
                            res.send("Item-Name already exists")
                        }
                        else{
                            res.send("Barcode already exists")
                        }
                    })
                }
            })
        }

        else {
            con.query('insert into current_status_products values(?,?,?,?,?,?)',[Item_ID,Item_Name,Barcode,Availability,Cost,Description],(err,result)=>{
                if(err)
                {
                    console.log(err)
                }else {
                    //--> update this cmd to save the user back
                    res.send("Item Updated") ;
                }
                
            })
        }
        
    })
});



//adding of users to the database 
app.post('/post/add_user',(req,res)=>{
    //calling out the parameters from the post reqenst from postman

    const User_ID = (req.body.User_ID).toLowerCase()
    const User_Name = (req.body.User_Name).toLowerCase()
    const User_Password = req.body.User_Password
    const User_Mobile_Number = req.body.User_Mobile_Number
    const User_Email = req.body.User_Email

    //checking if user_id and email_id are unique
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
                    res.send("User-Id already exists")
                }
                else{
                    res.send("Email Address already exists")
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
                            con.query('insert into user_details values(?,?,?,?,?)',[User_ID,User_Name,hash,User_Mobile_Number,User_Email],(err,result)=>{
                                if(err)
                                {
                                    console.log(err)
                                }else {
                                    //--> update tghis cmd to save the user back
                                    res.send("User Updated") ;
                                }
                            })
                        })
                    })
                }
                else {
                    res.send("Password must be between 8-100 long , it must have a lower case , a upper case and a digit  ")
                }
            }
            else{
                res.send("Mobile Number should be in the format +919926xxxxxx")
            }
        }
    })
})


app.listen(3000,(err)=>{
    if(err)
    {
        console.log(err)
    }else {
        console.log("on port 3000")
    }
})