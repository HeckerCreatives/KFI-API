const mongoose = require("mongoose");

const beginningBalanceSchema = new mongoose.Schema(
  {
    year: { type: Number, required: true },
    memo: { type: String },
    encodedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    debit: { type: Number, default: 0 },
    credit: { type: Number, default: 0 },
    entryCount: { type: Number, default: 0 },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

beginningBalanceSchema.set("toJSON", {
  transform: (doc, ret) => {
    delete ret.updatedAt;
    delete ret.__v;
    return ret;
  },
});

const BeginningBalance = mongoose.model("BeginningBalance", beginningBalanceSchema);

module.exports = BeginningBalance;
