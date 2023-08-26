// establishing a connection with mysql
const dotenv = require("dotenv");
const mysql = require("mysql");

dotenv.config({path:'./config.env'});


const con = mysql.createConnection({
    host:'localhost',
    user:'root',
    password :process.env.MYSQLPASSWORD,
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