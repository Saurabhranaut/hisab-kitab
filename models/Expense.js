const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema({

    user_id: Number,

    desc: String,

    amount: Number,

    paidBy: Number,

    splitAmong: Array,

    date: {
        type: Date,
        default: Date.now
    }

});


module.exports = mongoose.model("Expense", expenseSchema);