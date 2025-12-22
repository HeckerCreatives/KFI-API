const mongoose = require("mongoose");

const financialStatementEntrySchema = new mongoose.Schema(
  {
    financialStatement: { type: mongoose.Schema.Types.ObjectId, ref: "FinancialStatement" },
    line: { type: Number, required: true },
    acctCode: { type: mongoose.Schema.Types.ObjectId, ref: "ChartOfAccount" },
    remarks: { type: String },
    amountType: { type: String, enum: ["monthly", "yearly"], lowercase: true },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

const FinancialStatementEntry = mongoose.model("FinancialStatementEntry", financialStatementEntrySchema);

module.exports = FinancialStatementEntry;
