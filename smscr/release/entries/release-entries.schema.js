const mongoose = require("mongoose");

const releaseEntrySchema = new mongoose.Schema(
  {
    line: { type: Number },
    release: { type: mongoose.Schema.Types.ObjectId, ref: "Release" },
    loanReleaseEntryId: { type: mongoose.Schema.Types.ObjectId, ref: "Entry" },
    dueDate: { type: Date },
    week: { type: Number },
    acctCode: { type: mongoose.Schema.Types.ObjectId, ref: "ChartOfAccount", required: true },
    debit: { type: Number, required: true },
    credit: { type: Number, required: true },
    particular: { type: String },
    encodedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

releaseEntrySchema.set("toJSON", {
  transform: (doc, ret) => {
    delete ret.updatedAt;
    delete ret.__v;
    return ret;
  },
});

const ReleaseEntry = mongoose.model("ReleaseEntry", releaseEntrySchema);

module.exports = ReleaseEntry;
