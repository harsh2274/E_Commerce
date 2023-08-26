const mongooose = require('mongoose') ;
const userSchema = new mongooose.Schema({
    admin_id: {
        type: String,
        required:true
    },
    admin_name: {
        type: String,
        required:true
    },
    admin_password: {
        type: String,
        required:true
    },
    admin_email: {
        type: String,
        required:true
    }
}) 

const Admin = mongooose.model('admin_details',userSchema);

module.exports = Admin ;
