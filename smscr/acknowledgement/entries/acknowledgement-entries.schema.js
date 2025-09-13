const mongoose = require("mongoose");

const acknowledgementEntrySchema = new mongoose.Schema(
  {
    line: { type: Number },
    acknowledgement: { type: mongoose.Schema.Types.ObjectId, ref: "Acknowledgement" },
    loanReleaseEntryId: { type: mongoose.Schema.Types.ObjectId, ref: "Entry" },
    acctCode: { type: mongoose.Schema.Types.ObjectId, ref: "ChartOfAccount", required: true },
    debit: { type: Number, required: true },
    credit: { type: Number, required: true },
    particular: { type: String },
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
