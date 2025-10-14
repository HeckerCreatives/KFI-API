const mongoose = require("mongoose");

const paymentScheduleSchema = new mongoose.Schema(
  {
    loanRelease: { type: mongoose.Schema.Types.ObjectId, ref: "Transaction" },
    loanSchemaEntry: { type: mongoose.Schema.Types.ObjectId, ref: "Entry" },
    emergencyLoan: { type: mongoose.Schema.Types.ObjectId, ref: "EmergencyLoan" },
    emergencyLoanEntry: { type: mongoose.Schema.Types.ObjectId, ref: "EmergencyLoanEntry" },
    date: { type: Date, required: true },
    paid: { type: Boolean, required: true, default: false },
    week: { type: Number },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

paymentScheduleSchema.set("toJSON", {
  transform: (ret, doc) => {
    delete ret.updatedAt;
    delete ret.createdAt;
    delete ret.__v;
    return ret;
  },
});

const PaymentSchedule = mongoose.model("PaymentSchedule", paymentScheduleSchema);

module.exports = PaymentSchedule;
