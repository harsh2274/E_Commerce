// calling the required libraries
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
app.use(express.json())

// Accessing the config.env file for access of secret details
const dotenv = require("dotenv");
dotenv.config({path:'./config.env'});

// establishing a conenction with mysql 

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
    secret : process.env.SESSIONSECRET ,
    resave : false,
    saveUninitialized : true ,
    cookie : {secure : false}
}))


//adding of items 
app.post('/post/new_item',(req,res)=>{
    
    // requesting of items from the rest API
    const Item_ID = (req.body.item_id).toLowerCase() 
    const Item_Name = (req.body.item_name).toLowerCase() 
    let Item_Type = (req.body.item_type).toLowerCase()
    const Item_Barcode = req.body.item_barcode
    let Item_Availability = (req.body.item_availability).toLowerCase()
    let Item_Cost = req.body.item_cost
    const Item_Description = req.body.item_description

    //if cost is not specified by default it will be made as zero
    if(Item_Cost==""){
        Item_Cost = 0 
    }

    //by default a item type will be connsiderd as a product
    if(Item_Type==""){
        Item_Type = "product"
    }

    //by default the availibility will be no 
    if(Item_Availability==""){
        Item_Availability = "no"
    }
 
    // every item must have a ID
    if(Item_ID==""){
        res.status(400).json({error: "Please specify a unique item_id"}) ;
    }

    //every item must have a name
    else if(Item_Name==""){
        res.status(400).json({error: "Please specify a unique item_name"}) ;
    }

    // checking if availability is either yes or no
    else if(Item_Availability!="no" && Item_Availability!="yes" ){
        res.status(400).json({error: "Availability can be either yes or no"}) ;
    }

    // checking if type is either product or service
    else if(Item_Type!="service" && Item_Type!="product" ){
        res.status(400).json({error: "Item Type can be either product or service"}) ;
    }

    // checking if cost is an integer
    else if(!Number.isInteger(Item_Cost)){
        res.status(400).json({error: "Item Cost must be an integer"}) ;
    }    

    // checking if barcode is an integer
    else if(!Number.isInteger(Item_Barcode) && Item_Barcode!="" ){
        res.status(400).json({error: "Item Barcode must be an integer"}) ;
    } 

    else{
        con.query('select * from items_status where item_id =? or item_name =?',[Item_ID,Item_Name],(err,result)=>{
            // logging errors if any
            if(err){
                console.log(err)
            }
        
            // checking if the Item_ID already exits or the Item_Name or the Barcode
            else if(result.length >= 1){
                con.query('select * from items_status where item_id =?',Item_ID,(err,result)=>{
                    if(err){
                        console.log(err);
                    }else if(result.length >=1){
                        res.status(400).json({error: "Item_Id must be unique"});
                    }else{
                        res.status(400).json({error: "Item_Name must be unique"}) ;
                    }
                });
            }

            else {
                // checking if the barcode is specified
                if(Item_Barcode !="") {
                    con.query('insert into items_status values(?,?,?,?,?,?,?)',[Item_ID,Item_Name,Item_Type,Item_Barcode,Item_Availability,Item_Cost,Item_Description],(err,result)=>{
                        if(err){
                            console.log(err)
                        }else {
                            res.json({message:"Item Updated"}) ;
                        }
                    })
                }

                //if the item does not have a barcode
                else {
                    con.query('insert into items_status values(?,?,?,?,?,?,?)',[Item_ID,Item_Name,Item_Type,,Item_Availability,Item_Cost,Item_Description],(err,result)=>{
                        if(err){
                            console.log(err)
                        }else {
                            res.json({message:"Item Updated"}) ;
                        }
                    })
                }
            }
        })
    }
});


app.post('/admin/search_by_date',(req,res)=>{
    
    const from_date = req.body.from_date;
    const to_date = req.body.to_date;
    
    //checking if from date is empty or not 
    let start_date = "" ;
    let end_date = "" ;

    //if the from date is not empty
    if(from_date!=""){
        start_date = new Date(from_date).toISOString().split('T')[0];

        //fetching the results between the two specified dates
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

        //fetching the results from the specified date
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

    // if from date is empty
    else {

        //fetching the results upto the specified date
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

        // fetching all the orders
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

// searching by other parameters (item_id , item_name and item_type)
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

app.post("/login", async(req,res)=>{
    const admin_email = (req.body.user_email).toLowerCase() ;
    const admin_pass = req.body.user_pass ; 
    con.query('select * from admin_details where Admin_Email=?',admin_email,async(err,result)=>{
        if(err)
        {
            console.log(err)
        }
        else{
            if(result.length==1){
                const user_database_pass = result[0].User_Password ;
                const user_name = result[0].User_ID ; 
                const isMatch = await bcrypt.compare(admin_pass,user_database_pass);
            
                if(!isMatch) {
                    res.status(400).json({error: "Invalid Password"}) ;
                }else {
                    jwt.sign({ user_name },process.env.SECRETKEY,{expiresIn:'300s'},async(err1,token)=>{
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

//function for token verification
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

// the application works on port 2999
app.listen(2999,(err)=>{
    if(err)
    {
        console.log(err)
    }else {
        console.log("on port 2999")
    }
})