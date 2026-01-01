const mongoose = require("mongoose");

const trialBalanceEntrySchema = new mongoose.Schema(
  {
    trialBalance: { type: mongoose.Schema.Types.ObjectId, ref: "TrialBalance" },
    line: { type: Number, required: true },
    remarks: { type: String },
    acctCode: { type: mongoose.Schema.Types.ObjectId, ref: "ChartOfAccount" },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

const TrialBalanceEntry = mongoose.model("TrialBalanceEntry", trialBalanceEntrySchema);

module.exports = TrialBalanceEntry;
