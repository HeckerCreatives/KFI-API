const mongoose = require("mongoose");

const loanReleaseEntryParam = new mongoose.Schema(
  {
    code: { type: String },
    label: { type: String },
    accountCode: { type: mongoose.Schema.Types.ObjectId, ref: "ChartOfAccount" },
    sort: { type: Number },
  },
  { timestamps: true }
);

const LoanReleaseEntryParam = mongoose.model("LoanReleaseEntryParam", loanReleaseEntryParam);

module.exports = LoanReleaseEntryParam;
