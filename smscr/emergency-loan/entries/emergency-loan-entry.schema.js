const mongoose = require("mongoose");

const emergencyLoanEntrySchema = new mongoose.Schema(
  {
    emergencyLoan: { type: mongoose.Schema.ObjectId, ref: "EmergencyLoan", required: true },
    client: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" },
    particular: { type: String },
    acctCode: { type: mongoose.Schema.Types.ObjectId, ref: "ChartOfAccount", required: true },
    debit: { type: Number, required: true },
    credit: { type: Number, required: true },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

emergencyLoanEntrySchema.set("toJSON", {
  transform: (ret, doc) => {
    delete ret.updatedAt;
    delete ret.__v;
    return ret;
  },
});

const EmergencyLoanEntry = mongoose.model("EmergencyLoanEntry", emergencyLoanEntrySchema);

module.exports = EmergencyLoanEntry;
