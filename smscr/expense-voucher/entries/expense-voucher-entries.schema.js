const mongoose = require("mongoose");

const expenseVoucherEntriesSchema = new mongoose.Schema(
  {
    line: { type: Number },
    expenseVoucher: { type: mongoose.Schema.Types.ObjectId, ref: "ExpenseVoucher", required: true },
    client: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" },
    acctCode: { type: mongoose.Schema.Types.ObjectId, ref: "ChartOfAccount", required: true },
    debit: { type: Number, required: true },
    credit: { type: Number, required: true },
    particular: { type: String },
    cvForRecompute: { type: String },
    encodedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

expenseVoucherEntriesSchema.set("toJSON", {
  transform: (doc, ret) => {
    delete ret.updatedAt;
    delete ret.__v;
    return ret;
  },
});

const ExpenseVoucherEntry = mongoose.model("ExpenseVoucherEntry", expenseVoucherEntriesSchema);

module.exports = ExpenseVoucherEntry;
