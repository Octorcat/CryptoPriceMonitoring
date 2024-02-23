const mongoose = require('mongoose');

const AlertSchema = mongoose.Schema({
    walletAddr: String,
    tokenName: String,
    tokenSymbol: String,
    tokenAddr: String,
    channel: [],
    maxDays: Number,
    price: Number,
    when: Number,
    time: Number,
    status: Number,    
    contactInfo: {},
    default: Number
}, {
    timestamps: true
});

module.exports = mongoose.model('Alert', AlertSchema);