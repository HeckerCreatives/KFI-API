const mongoose = require("mongoose");

const entrySchema = new mongoose.Schema(
  {
    transaction: { type: mongoose.Schema.Types.ObjectId, ref: "Transaction" },
    client: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" },
    center: { type: mongoose.Schema.Types.ObjectId, ref: "Center" },
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Loan" },
    acctCode: { type: mongoose.Schema.Types.ObjectId, ref: "ChartOfAccount" },
    particular: { type: String },
    debit: { type: Number },
    credit: { type: Number },
    interest: { type: Number },
    cycle: { type: Number },
    checkNo: { type: String },
    encodedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    status: { type: String, enum: ["open", "closed", "with overdue"] },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

entrySchema.set("toJSON", {
  transform: (doc, ret) => {
    delete ret.__v;
    delete ret.updatedAt;
    return ret;
  },
});

const Entry = mongoose.model("Entry", entrySchema);

module.exports = Entry;
