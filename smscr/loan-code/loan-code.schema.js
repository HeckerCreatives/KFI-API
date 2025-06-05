const mongoose = require("mongoose");

const loanCodeSchema = new mongoose.Schema({
  loan: { type: mongoose.Schema.Types.ObjectId, ref: "Loan" },
  module: { type: String },
  loanType: { type: String },
  acctCode: { type: mongoose.Schema.Types.ObjectId, ref: "ChartOfAccount" },
  sortOrder: { type: Number },
  deletedAt: { type: Date },
});

loanCodeSchema.set("toJSON", {
  transform: (doc, ret) => {
    delete ret.updatedAt;
    delete ret.__v;
    return ret;
  },
});

const LoanCode = mongoose.model("LoanCode", loanCodeSchema);

module.exports = LoanCode;
