const mongoose = require("mongoose");

const officialReceiptEntrySchema = new mongoose.Schema(
  {
    loanRelease: { type: mongoose.Schema.Types.ObjectId, ref: "Transaction" },
    noOfWeeks: { type: Number },
    client: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" },
    acctCode: { type: mongoose.Schema.Types.ObjectId, ref: "ChartOfAccount", required: true },
    debit: { type: Number, required: true },
    credit: { type: Number, required: true },
  },
  { timestamps: true }
);

const OfficialReceiptEntry = mongoose.model("OfficialReceiptEntry", officialReceiptEntrySchema);

module.exports = OfficialReceiptEntry;
