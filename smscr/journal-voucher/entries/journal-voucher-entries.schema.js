const mongoose = require("mongoose");

const journalVoucherEntrySchema = new mongoose.Schema(
  {
    journalVoucher: { type: mongoose.Schema.Types.ObjectId, ref: "JournalVoucher", required: true },
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

journalVoucherEntrySchema.set("toJSON", {
  transform: (ret, doc) => {
    delete ret.updatedAt;
    delete ret.__v;
    return ret;
  },
});

const JournalVoucherEntry = mongoose.model("JournalVoucherEntry", journalVoucherEntrySchema);

module.exports = JournalVoucherEntry;
