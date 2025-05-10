const mongoose = require("mongoose");

const emergencyLoanSchema = new mongoose.Schema(
  {
    cvNo: { type: String },
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: "Supplier" },
    date: { type: Date },
    acctMonth: { type: String },
    acctYear: { type: String },
    checkNo: { type: String },
    checkDate: { type: Date },
    bankCode: { type: mongoose.Schema.Types.ObjectId, ref: "Bank" },
    amount: { type: Number },
    remarks: { type: String },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

emergencyLoanSchema.set("toJSON", {
  transform: (doc, ret) => {
    delete ret.updatedAt;
    delete ret.__v;
    return ret;
  },
});

const EmergencyLoan = mongoose.model("EmergencyLoan", emergencyLoanSchema);

module.exports = EmergencyLoan;
