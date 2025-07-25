const mongoose = require("mongoose");

const loanReleaseSchema = new mongoose.Schema(
  {
    cvNo: { type: String },
    center: { type: mongoose.Schema.Types.ObjectId, ref: "Center" },
    name: { type: String },
    refNumber: { type: String },
    date: { type: Date },
    acctMonth: { type: String },
    acctYear: { type: String },
    noOfWeeks: { type: String },
    typeOfLoan: { type: mongoose.Schema.Types.ObjectId, ref: "Loan" },
    checkNo: { type: String },
    checkDate: { type: Date },
    bankCode: { type: mongoose.Schema.Types.ObjectId, ref: "Bank" },
    amount: { type: Number },
    cycle: { type: String },
    interestRate: { type: Number },
    remarks: { type: String },
    payee: { type: String },
    encodedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

loanReleaseSchema.set("toJSON", {
  transform: (doc, ret) => {
    delete ret.updatedAt;
    delete ret.__v;
    return ret;
  },
});

const LoanRelease = mongoose.model("LoanRelease", loanReleaseSchema);

module.exports = LoanRelease;
