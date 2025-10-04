const mongoose = require("mongoose");

const expenseVoucherSchema = new mongoose.Schema(
  {
    code: { type: String },
    supplier: { type: String },
    date: { type: Date },
    acctMonth: { type: String },
    acctYear: { type: String },
    checkNo: { type: String },
    checkDate: { type: Date },
    refNo: { type: String },
    bankCode: { type: mongoose.Schema.Types.ObjectId, ref: "Bank" },
    amount: { type: Number },
    remarks: { type: String },
    deletedAt: { type: Date },
    encodedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    preparedBy: { type: String },
    checkedBy: { type: String },
    approvedBy: { type: String },
    receivedBy: { type: String },
  },
  { timestamps: true }
);

expenseVoucherSchema.set("toJSON", {
  transform: (doc, ret) => {
    delete ret.updatedAt;
    delete ret.__v;
    return ret;
  },
});

const ExpenseVoucher = mongoose.model("ExpenseVoucher", expenseVoucherSchema);

module.exports = ExpenseVoucher;
