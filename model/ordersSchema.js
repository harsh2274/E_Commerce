const mongooose = require('mongoose') ;
const userSchema = new mongooose.Schema({
    item_id: {
        type: String,
        required:true,
    },
    item_name: {
        type: String,
    },
    item_cost: {
        type: Number,
        required:true
    },
    item_type: {
        type: String,
        required:true,
    },
    item_tax: {
        type:Number
    },
    item_quantity:{
        type:Number
    },
    item_total_amt: {
        type:Number
    },
    item_quantity:{
        type:Number
    },
    time_purchase:{
        type:Date
    }
}) 

const Order = mongooose.model('order_details',userSchema);

module.exports = Order ;
