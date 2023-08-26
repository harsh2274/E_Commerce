const mongooose = require('mongoose') ;
const userSchema = new mongooose.Schema({
    user_id: {
        type: String,
        required:true
    },
    user_name: {
        type: String,
        required:true
    },
    user_password: {
        type: String,
        required:true
    },
    mobile_number: {
        type: Number,
        required:true
    },
    user_email: {
        type: String,
        required:true
    }
}) 

const User = mongooose.model('user_details',userSchema);

module.exports = User ;
