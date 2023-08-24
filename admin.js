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
app.use(express.json())

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


//adding of items 
app.post('/post/new_item',(req,res)=>{
    
    // requesting of items from the rest API
    const Item_ID = (req.body.item_id).toLowerCase() 
    const Item_Name = (req.body.item_name).toLowerCase() 
    const Item_Type = (req.body.item_type).toLowerCase()
    const Item_Barcode = req.body.item_barcode
    const Item_Availability = (req.body.item_availability).toLowerCase()
    const Item_Cost = req.body.item_cost
    const Item_Description = req.body.item_description

    // every item must have a ID
    if(Item_ID==""){
        res.send("Error 200 : Please specify a unique item_id")
    }

    //every item must have a name
    if(Item_Name==""){
        res.send("Error 201 : Please specify a unique item_name")
    }

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

    // checking if availability is either yes or no
    if(Item_Availability!="no" || Item_Availability!="yes" ){
        res.send("Error 202 : Availability can be either yes or no")
    }

    // checking if type is either product or service
    if(Item_Type!="service" || Item_Type!="product" ){
        res.send("Error 203 : Availability can be either product or service")
    }

    // checking if cost is an integer
    if(!Number.isInteger(Item_Cost)){
        res.send("Error 204 : Item Cost must be an integer")
    }    

    // checking if barcode is an integer
    if(!Number.isInteger(Item_Barcode) && Item_Barcode!="" ){
        res.send("Error 205 : Item Barcode must be an integer")
    } 

    con.query('select * from items_status where item_id =? or item_name =?',[Item_ID,Item_Name],(err,result)=>{
        // logging errors if any
        if(err){
            console.log(err)
        }
        
        // checking if the Item_ID already exits or the Item_Name or the Barcode
        else if(result.length >= 1){
            con.query('select * from items_status where item_id =?',Item_ID,(err,result)=>{
                if(err){
                    console.log(err)
                }
                else if(result.length >=1){
                    res.send("Error 210 : Item_Id must be unique")
                }
                else{
                    res.send("Error 211 : Item_Name must be unique")
                }
            })
        }

        else {
            // checking if the barcode is specified
            if(item_barcode !="") {
                con.query('insert into items_status values(?,?,?,?,?,?,?)',[Item_ID,Item_Name,Item_Type,Item_Barcode,Item_Availability,Item_Cost,Item_Description],(err,result)=>{
                    if(err)
                    {
                        console.log(err)
                    }else {
                        res.send("Item Updated") ;
                    }
                })
            }
            //if the item does not have a barcode
            else {
                con.query('insert into items_status values(?,?,?,?,?,?,?)',[Item_ID,Item_Name,Item_Type,,Item_Availability,Item_Cost,Item_Description],(err,result)=>{
                    if(err)
                    {
                        console.log(err)
                    }else {
                        res.send("Item Updated") ;
                    }
                })
            }

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

app.listen(2999,(err)=>{
    if(err)
    {
        console.log(err)
    }else {
        console.log("on port 2999")
    }
})