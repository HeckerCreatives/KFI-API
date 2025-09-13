const mongoose = require("mongoose");

const damayanFundSchema = new mongoose.Schema(
  {
    code: { type: String, unique: true, required: true },
    name: { type: String },
    nature: { type: String },
    refNo: { type: String },
    remarks: { type: String },
    date: { type: Date, required: true },
    acctMonth: { type: String, required: true },
    acctYear: { type: String, required: true },
    checkNo: { type: String, required: true },
    checkDate: { type: Date, required: true },
    bankCode: { type: mongoose.Schema.Types.ObjectId, ref: "Bank", required: true },
    amount: { type: Number, required: true },
    encodedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

damayanFundSchema.set("toJSON", {
  transform: (doc, ret) => {
    delete ret.updatedAt;
    delete ret.__v;
    return ret;
  },
});

const DamayanFund = mongoose.model("DamayanFund", damayanFundSchema);

module.exports = DamayanFund;
