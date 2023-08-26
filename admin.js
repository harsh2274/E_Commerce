// importing base libraries
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require("dotenv");
const app = express();

// configuring the path for cofig.env for string 
dotenv.config({path:'./config.env'}) ;
require('./db/conn');
app.use(express.json());

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

const Admin = require("./model/adminSchema");

const PORT = process.env.PORTADMIN;

//adding of items 
app.post('/admin/new_item',verifyToken,(req,res)=>{
    // requesting of items from the rest API
    const Item_ID = (req.body.item_id).toLowerCase() 
    const Item_Name = (req.body.item_name).toLowerCase() 
    let Item_Type = (req.body.item_type).toLowerCase()
    const Item_Barcode = req.body.item_barcode
    let Item_Availability = (req.body.item_availability).toLowerCase()
    let Item_Cost = req.body.item_cost
    const Item_Description = req.body.item_description

    //if cost is not specified by default it will be made as zero
    if(Item_Cost === ""){
        Item_Cost = 0 
    }

    //by default a item type will be connsiderd as a product
    if(Item_Type === ""){
        Item_Type = "product"
    }

    //by default the availibility will be no 
    if(Item_Availability === ""){
        Item_Availability = "no"
    }
 
    // every item must have a ID
    if(Item_ID === ""){
        return res.status(400).json({error: "Please specify a unique item_id"}) ;
    }

    //every item must have a name
    else if(Item_Name==""){
        return res.status(400).json({error: "Please specify a unique item_name"}) ;
    }

    // checking if availability is either yes or no
    else if(Item_Availability!="no" && Item_Availability!="yes" ){
        return res.status(400).json({error: "Availability can be either yes or no"}) ;
    }

    // checking if type is either product or service
    else if(Item_Type!="service" && Item_Type!="product" ){
        return res.status(400).json({error: "Availability can be either product or service"}) ;
    }

    // checking if cost is an integer
    else if(!Number.isInteger(Item_Cost)){
        return res.status(400).json({error: "Item Cost must be an integer"}) ;
    }    

    // checking if barcode is an integer
    else if(!Number.isInteger(Item_Barcode) && Item_Barcode!="" ){
        return res.status(400).json({error: "Item Barcode must be an integer"}) ;
    } 

    else{
        Item.findOne({$or:[{item_id:Item_ID} , {item_name : Item_Name}]})
        .then((itemExist)=>{
            // error if same item id or item name
            if(itemExist){
                return res.status(422).json({error : "Item Name/ID already exist"}); 
            }
            
            // checking if the item has a barcode
            if(Item_Barcode !== "") {
                const item = new Item({item_id:Item_ID,item_name:Item_Name,item_type:Item_Type,item_availability:Item_Availability,item_cost:Item_Cost,item_description:Item_Description});
                    item.save().then(() =>{
                        return res.status(201).json({message:"Item Registered Successfully"}) ; // new item successfully added
                    }).catch((err) => res.status(500).json({error:err})) ;
            }

            //if the item does not have a barcode
            else {
                const item = new Item({item_id:Item_ID,item_name:Item_Name,item_type:Item_Type,item_availability:Item_Availability,item_cost:Item_Cost,item_description:Item_Description});
                    item.save().then(() =>{
                        return res.status(201).json({message:"Item Registered Successfully"}) ; // new item successfully added
                    }).catch((err) => res.status(500).json({error:err})) ;
            }
        }).catch(err=>{console.log(err);});
    }
});

// this is a function for admin to srerch the results via date
app.post('/admin/search',verifyToken,async(req,res)=>{
    const selectedDate = new Date(req.body.date_from); // the date from which the user wants the dats
    const no_of_days = req.body.days_after ; // the no of days thereafter user wants the data
    const nextDay = new Date(selectedDate); 
    nextDay.setDate(nextDay.getDate() + no_of_days); 

    try {
        // creating an event specifying the days
        const events = await Order.find({
            time_purchase: {
                $gte: selectedDate,
                $lt: nextDay
            }
        });

        // creating a session for storing the details

        req.session.admin = [] ;
        let total_tax = 0 ;
        let total_product_cost = 0 ;

        // computing all the imformation for the given days
        const totalCost = events.reduce((sum, event) => {
            let count = 0 ;
            for(let i =0 ; i<req.session.admin.length ; i++)
            {
                if(req.session.admin[i].item_name === event.item_name){
                    req.session.admin[i].quantity += event.item_quantity;
                    count ++;
                }
            }
            // adding a new item to the cart
            if(count === 0)
            {
                const cart_data = {
                    item_id : event.item_id,
                    item_name : event.item_name,
                    item_cost : parseFloat(event.item_cost),
                    item_type : event.item_type,
                    quantity : event.item_quantity
                };
                req.session.admin.push(cart_data);
            }
            const cost = event.item_total_amt ;                         // computing total cost amount including tax
            total_tax += event.item_tax*event.item_quantity ;           // computing total taxes to pay
            total_product_cost += event.item_cost*event.item_quantity ; // computing total cost without tax
            return sum + cost;
        }, 0); 


        const total_cost ={
            Total_Cost_Items : total_product_cost 
        }
        const total_tax_data = {
            Total_Tax : total_tax
        }
        const total_amount = {
            Total_Collection : totalCost 
        }

        // pushing all the details to the admin session
        req.session.admin.push(total_cost); 
        req.session.admin.push(total_tax_data);
        req.session.admin.push(total_amount);
        return res.send(JSON.parse(JSON.stringify(req.session.admin))) ; // passing the string with all the details
        
    } catch (error) {
        console.error('Error fetching events :', error);
        return res.status(500).json({ error: 'Date must be of the format YYYY-MM-DD' });
    }

})

app.post("/admin/login" , async(req,res)=>{
    // collecting the username and password using restapi
    const admin_email = (req.body.admin_email).toLowerCase() ;
    const admin_pass = req.body.admin_pass ;
    
    let admin_db_password ; // refers to password saved in the database
    let admin_db_id ; // refers to the id saved in the database

    // checking if the email id is correct
    const admin = await User.findOne({admin_email:admin_email});
    if(admin){
        //getting the passwords
        admin_db_password = admin.admin_password ;
        admin_db_id = admin.admin_id ;

        //checking if the password is correct
        const isMatch = await bcrypt.compare(admin_pass,admin_db_password);
        if(!isMatch) {
            return res.status(400).json({error: "Invalid Password"}) ;
        }

        // creating a token for access of the application , time limit 5min
        else {
            jwt.sign({ admin_db_id },secretKey,{expiresIn:'300s'},async(err1,token)=>{
                if(err1){
                    console.log(err1) ;

                }else{
                    res.cookie("jwtoken",token,{
                        expires: new Date(Date.now() + 300000),
                        httpOnly:true
                    });
                    return res.json({message : "Admin Login Successfully"});
                }
            })
        }
    }
})

//function to verify the token
function verifyToken(req,res,next){
    const token = req.cookies.jwtoken ;
    if(typeof token !== "undefined"){
        const verifyUser = jwt.verify(token,secretKey) ;
        console.log(verifyUser);
        next() ;
    }else{
        res.status(400).json({error: "Token is not valid"}) ;
    }
}

app.listen(PORT,(err)=>{
    if(err){
        console.log(err);
    }else {
        console.log(`Server is running at port no ${PORT}`);
    }
})