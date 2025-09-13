const mongoose = require("mongoose");

const damayanFundEntrySchema = new mongoose.Schema(
  {
    line: { type: Number },
    damayanFund: { type: mongoose.Schema.ObjectId, ref: "DamayanFund", required: true },
    client: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" },
    particular: { type: String },
    acctCode: { type: mongoose.Schema.Types.ObjectId, ref: "ChartOfAccount", required: true },
    debit: { type: Number, required: true },
    credit: { type: Number, required: true },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

damayanFundEntrySchema.set("toJSON", {
  transform: (ret, doc) => {
    delete ret.updatedAt;
    delete ret.__v;
    return ret;
  },
});

const DamayanFundEntry = mongoose.model("DamayanFundEntry", damayanFundEntrySchema);

module.exports = DamayanFundEntry;
