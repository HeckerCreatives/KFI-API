const mongoose = require("mongoose");

const loanSchema = new mongoose.Schema(
  {
    code: { type: String },
    loanCodes: [{ type: mongoose.Schema.Types.ObjectId, ref: "LoanCode" }],
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

loanSchema.set("toJSON", {
  transform: (doc, ret) => {
    delete ret.updatedAt;
    delete ret.__v;
    return ret;
  },
});

const Loan = mongoose.model("Loan", loanSchema);

module.exports = Loan;
