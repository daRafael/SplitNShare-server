const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const groupSchema = new Schema({
    name: { type: String, required: true},
    owner: { type: Schema.Types.ObjectId, ref: 'User' },
    members: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    expenses: [{ type: Schema.Types.ObjectId, ref:'Expense' }],
    date: { type: Date, default: Date.now }
})

module.exports = model("Group", groupSchema);
