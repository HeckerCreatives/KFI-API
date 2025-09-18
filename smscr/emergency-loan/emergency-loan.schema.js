const mongoose = require("mongoose");

const emergencyLoanSchema = new mongoose.Schema(
  {
    code: { type: String, unique: true, required: true },
    client: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true },
    refNo: { type: String },
    remarks: { type: String },
    date: { type: Date, required: true },
    acctMonth: { type: String, required: true },
    acctYear: { type: String, required: true },
    checkNo: { type: String },
    checkDate: { type: Date, required: true },
    bankCode: { type: mongoose.Schema.Types.ObjectId, ref: "Bank", required: true },
    amount: { type: Number, required: true },
    encodedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    deletedAt: { type: Date },
    preparedBy: { type: String },
    checkedBy: { type: String },
    approvedBy: { type: String },
    receivedBy: { type: String },
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
