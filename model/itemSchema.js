const mongooose = require('mongoose') ;
const userSchema = new mongooose.Schema({
    item_id: {
        type: String,
        required:true,
        unique:true
    },
    item_name: {
        type: String,
        unique:true
    },
    item_type: {
        type: String,
        required:true,
        default:"product"
    },
    item_barcode: {
        type: Number
    },
    item_availability: {
        type: String,
        required:true,
        default : "no"
    },
    item_cost: {
        type:Number
    },
    item_description: {
        type: String
    }
}) 

const Item = mongooose.model('item_details',userSchema);

module.exports = Item ;
