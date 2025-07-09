const mongoose = require("mongoose");

const releaseSchema = new mongoose.Schema(
  {
    code: { type: String },
    center: { type: mongoose.Schema.Types.ObjectId, ref: "Center" },
    refNo: { type: String },
    remarks: { type: String },
    type: { type: String },
    acctOfficer: { type: String },
    date: { type: Date },
    acctMonth: { type: String },
    acctYear: { type: String },
    checkNo: { type: String },
    checkDate: { type: Date },
    bankCode: { type: mongoose.Schema.Types.ObjectId, ref: "Bank" },
    amount: { type: Number },
    cashCollectionAmount: { type: Number },
    deletedAt: { type: Date },
    encodedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { new: true }
);

releaseSchema.set("toJSON", {
  transform: (doc, ret) => {
    delete ret.updatedAt;
    delete ret.__v;
    return ret;
  },
});

const Release = mongoose.model("Release", releaseSchema);

module.exports = Release;
