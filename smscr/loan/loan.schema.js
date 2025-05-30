const mongoose = require("mongoose");

const loanSchema = new mongoose.Schema(
  {
    code: { type: String },
    description: { type: String },
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
