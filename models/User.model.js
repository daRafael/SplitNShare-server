const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const userSchema = new Schema({
    username: { type: String, unique: true, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    currency: { type: String, default: 'EUR' },
    friends: [{ type: Schema.Types.ObjectId, ref: "User" }],
    groups: { 
        owner: [{type: Schema.Types.ObjectId, ref: "Group"}], 
        member: [{type: Schema.Types.ObjectId, ref: "Group"}] 
    },
    balance: {type: Schema.Types.ObjectId, ref: "Balance"}
});

module.exports = model("User", userSchema);
