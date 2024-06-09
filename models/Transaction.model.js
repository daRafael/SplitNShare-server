const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const transactionSchema = new Schema({
    payer: { type: Schema.Types.ObjectId, ref: "User", required: true },
    payee: { type: Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'EUR' },
    date: { type: Date, default: Date.now},
    expense: { type: Schema.Types.ObjectId, ref: "Expense" },
    status: { type: String, enum: ['pending', 'paid'], default:'pending'}
})

module.exports = model("Transaction", transactionSchema);
