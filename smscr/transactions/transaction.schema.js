const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    type: { type: String, required: true, enum: ["loan release", "journal voucher", "expense voucher"] },
    code: { type: String, required: true },
    center: { type: mongoose.Schema.Types.ObjectId, ref: "Center", required: true },
    refNo: { type: String },
    remarks: { type: String },
    date: { type: Date, required: true },
    dueDate: { type: Date },
    acctMonth: { type: Number, required: true },
    acctYear: { type: Number, required: true },
    noOfWeeks: { type: Number, required: true },
    loan: { type: mongoose.Schema.Types.ObjectId, ref: "Loan", required: true },
    checkNo: { type: String, required: true },
    checkDate: { type: Date, required: true },
    bank: { type: mongoose.Schema.Types.ObjectId, ref: "Bank", required: true },
    amount: { type: Number, required: true },
    cycle: { type: Number, required: true },
    interest: { type: Number, required: true },
    entries: [{ type: mongoose.Schema.Types.ObjectId, ref: "Entry" }],
    isEduc: { type: Boolean },
    encodedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    deletedAt: { type: Date },
    status: { type: String, enum: ["open", "closed", "past due"], default: "open" },
  },
  { timestamps: true }
);

transactionSchema.set("toJSON", {
  transform: (doc, ret) => {
    delete ret.__v;
    delete ret.updatedAt;
    return ret;
  },
});

const Transaction = mongoose.model("Transaction", transactionSchema);

module.exports = Transaction;
