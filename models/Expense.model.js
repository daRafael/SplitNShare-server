const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const expenseSchema = new Schema({
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    description: { type: String, required: true },
    amountPaid: {type: Number, required: true},
    currency: { type: String, default: 'EUR' },
    paidBy: { type: Schema.Types.ObjectId, ref: "User" },
    splitWith: [{ type: Schema.Types.ObjectId, ref: "User" }],
    splitType: { type: String, enum: ['equally', 'exactAmounts' ], default:'equally' },
    splitAmounts: [Number],
    group: { type: Schema.Types.ObjectId, ref: "Group" },
    date: {type:  Date, default: Date.now }
})

//.pre can define middleware before some operations
//'save' saves the document before it is saved(created or updated)
expenseSchema.pre('save', function(next) {
    if(!this.paidBy || this.paidBy === 'Me') {
        this.paidBy = this.createdBy;
    }
    next();
});

module.exports = model("Expense", expenseSchema);
