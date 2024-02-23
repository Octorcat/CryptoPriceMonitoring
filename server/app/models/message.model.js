const mongoose = require('mongoose');

const MessageSchema = mongoose.Schema({
    'ALERT ID': String,
    'TOKEN NAME': String,
    'SYMBOL': String,
    'TOKEN ADDRESS': String,
    'CURRENT PRICE': Number,
    'ALERT PRICE': Number,
    'FAILED CALLTIMES': Number,
    'FAILED SMSTIMES': Number,
    'WALLET ADDRESS': String,
    'TIMESTAMP': Number,
}, {
    timestamps: true
});

module.exports = mongoose.model('Message', MessageSchema);