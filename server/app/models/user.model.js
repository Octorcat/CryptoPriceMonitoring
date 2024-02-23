const mongoose = require('mongoose');

const UsersSchema = mongoose.Schema({
    publicAddress: String,
    walletValue: [Object],
    nonce: String,
    jwtToken: String
}, {
    timestamps: true
});
module.exports = mongoose.model('Users', UsersSchema);