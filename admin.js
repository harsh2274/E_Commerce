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

app.post('/admin/search_by_date',(req,res)=>{
    
    const from_date = req.body.from_date;
    const to_date = req.body.to_date;
    
    //checking if from date is empty or not 
    let start_date = "" ;
    let end_date = "" ;
    if(from_date!=""){
        start_date = new Date(from_date).toISOString().split('T')[0];
        if(to_date!=""){
            end_date = new Date(to_date).toISOString().split('T')[0];
            con.query('select * from orders where Date_Purchase>=? & Date_Purchase<?',[start_date,end_date],(err,result)=>{
                if(err){
                    console.log(err)
                }
                
                else{
                    res.send(JSON.parse(JSON.stringify(result))) ;
                }
            })
        }
        else {
            con.query('select * from orders where Date_Purchase>=?',start_date,(err,result)=>{
                if(err){
                    console.log(err)
                }
                
                else{
                    res.send(JSON.parse(JSON.stringify(result))) ;
                }
            })
        }
    }

    else {
        if(to_date!=""){
            end_date = new Date(to_date).toISOString().split('T')[0];
            con.query('select * from orders where Date_Purchase<?',end_date,(err,result)=>{
                if(err){
                    console.log(err)
                }
                
                else{
                    res.send(JSON.parse(JSON.stringify(result))) ;
                }
            })
        }
        else {
            con.query('select * from orders',start_date,(err,result)=>{
                if(err){
                    console.log(err)
                }
                
                else{
                    res.send(JSON.parse(JSON.stringify(result))) ;
                }
            })
        }
    }
});

app.post('/admin/search_by_parameter',(req,res)=>{
    const Item_ID =  (req.body.item_id).toLowerCase();
    const Item_Name =  (req.body.item_name).toLowerCase();
    const Item_Type =  (req.body.item_type).toLowerCase();

    con.query('select * from orders where Item_Id=? or Item_Name=? or Item_Type=?',[Item_ID,Item_Name,Item_Type],(err,result)=>{
        if(err){
            console.log(err)
        }
        else{
            res.send(JSON.parse(JSON.stringify(result))) ;
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