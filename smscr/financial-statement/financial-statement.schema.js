const mongoose = require("mongoose");

const financialStatementSchema = new mongoose.Schema(
  {
    reportCode: { type: String, required: true, uppercase: true },
    reportName: { type: String, required: true },
    type: { type: String, enum: ["1C", "2C"], uppercase: true },
    primary: {
      year: { type: Number, required: true },
      month: { type: Number, required: true },
    },
    secondary: {
      year: { type: Number },
      month: { type: Number },
    },
    title: { type: String },
    subTitle: { type: String },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

const FinancialStatement = mongoose.model("FinancialStatement", financialStatementSchema);

module.exports = FinancialStatement;
