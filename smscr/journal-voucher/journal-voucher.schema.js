const mongoose = require("mongoose");

const journalVoucherSchema = new mongoose.Schema(
  {
    code: { type: String },
    // supplier: { type: mongoose.Schema.Types.ObjectId, ref: "Supplier" },
    nature: { type: String },
    remarks: { type: String },
    date: { type: Date },
    acctMonth: { type: String },
    acctYear: { type: String },
    checkNo: { type: String },
    checkDate: { type: Date },
    bankCode: { type: mongoose.Schema.Types.ObjectId, ref: "Bank" },
    amount: { type: Number },
    encodedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    deletedAt: { type: Date },
    preparedBy: { type: String },
    checkedBy: { type: String },
    approvedBy: { type: String },
    receivedBy: { type: String },
  },
  { timestamps: true }
);

journalVoucherSchema.set("toJSON", {
  transform: (doc, ret) => {
    delete ret.updatedAt;
    delete ret.__v;
    return ret;
  },
});

const JournalVoucher = mongoose.model("JournalVoucher", journalVoucherSchema);

module.exports = JournalVoucher;
