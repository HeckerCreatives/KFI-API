const mongoose = require("mongoose");

const officialReceiptSchema = new mongoose.Schema(
  {
    orNo: { type: String },
    center: { type: mongoose.Schema.Types.ObjectId, ref: "Center" },
    date: { type: Date },
    acctMonth: { type: Number },
    acctYear: { type: Number },
    acctOfficer: { type: String },
    checkNo: { type: String },
    checkDate: { type: String },
    bankCode: { type: mongoose.Schema.Types.ObjectId, ref: "Bank" },
    amount: { type: Number },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

officialReceiptSchema.set("toJSON", {
  transform: (doc, ret) => {
    delete ret.updatedAt;
    delete ret.__v;
    return ret;
  },
});

const OfficialReceipt = mongoose.model("OfficialReceipt", officialReceiptSchema);

module.exports = OfficialReceipt;
