const mongoose = require("mongoose");

const acknowledgementEntrySchema = new mongoose.Schema(
  {
    line: { type: Number },
    acknowledgement: { type: mongoose.Schema.Types.ObjectId, ref: "Acknowledgement" },
    loanReleaseId: { type: mongoose.Schema.Types.ObjectId, ref: "Transaction" },
    client: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" },
    dueDate: { type: Date },
    week: { type: Number },
    acctCode: { type: mongoose.Schema.Types.ObjectId, ref: "ChartOfAccount", required: true },
    debit: { type: Number, required: true },
    credit: { type: Number, required: true },
    particular: { type: String },
    type: { type: String, enum: ["SEA", "GRP", "IND"], uppercase: true },
    encodedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

acknowledgementEntrySchema.set("toJSON", {
  transform: (doc, ret) => {
    delete ret.updatedAt;
    delete ret.__v;
    return ret;
  },
});

const AcknowledgementEntry = mongoose.model("AcknowledgementEntry", acknowledgementEntrySchema);

module.exports = AcknowledgementEntry;
