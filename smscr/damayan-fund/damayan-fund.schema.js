const mongoose = require("mongoose");

const damayanFundSchema = new mongoose.Schema(
  {
    jvNo: { type: String },
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: "Supplier" },
    nature: { type: mongoose.Schema.Types.ObjectId, ref: "Nature" },
    remarks: { type: String },
    date: { type: Date },
    acctMonth: { type: String },
    acctYear: { type: String },
    checkNo: { type: String },
    checkDate: { type: String },
    bankCode: { type: mongoose.Schema.Types.ObjectId, ref: "Bank" },
    amount: { type: Number },
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
