const mongoose = require("mongoose");

const trialBalanceSchema = new mongoose.Schema(
  {
    reportCode: { type: String, required: true, uppercase: true },
    reportName: { type: String, required: true },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

const TrialBalance = mongoose.model("TrialBalance", trialBalanceSchema);

module.exports = TrialBalance;
