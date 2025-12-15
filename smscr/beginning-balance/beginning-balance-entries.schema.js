const mongoose = require("mongoose");

const beginningBalanceEntrySchema = new mongoose.Schema(
  {
    beginningBalance: { type: mongoose.Schema.Types.ObjectId, ref: "BeginningBalance", required: true },
    line: { type: Number },
    acctCode: { type: mongoose.Schema.Types.ObjectId, ref: "ChartOfAccount", required: true },
    debit: { type: Number, required: true, default: 0 },
    credit: { type: Number, required: true, default: 0 },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

beginningBalanceEntrySchema.set("toJSON", {
  transform: (doc, ret) => {
    delete ret.updatedAt;
    delete ret.__v;
    return ret;
  },
});

const BeginningBalanceEntry = mongoose.model("BeginningBalanceEntry", beginningBalanceEntrySchema);

module.exports = BeginningBalanceEntry;
