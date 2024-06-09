const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const balanceSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: "User" },
    balanceOverAll: {type: Number, default: 0},
    balanceWith: [{ 
        users: [{type: Schema.Types.ObjectId, ref: "User"}], 
        amounts: [{type: Number, required: true}] 
    }]
});

module.exports = model("Balance", balanceSchema);
