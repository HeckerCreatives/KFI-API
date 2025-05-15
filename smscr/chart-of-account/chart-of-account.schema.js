const mongoose = require("mongoose");

const chartOfAccountSchema = new mongoose.Schema(
  {
    code: { type: String },
    description: { type: String },
    classification: { type: String },
    nature: { type: String },
    groupAccount: { type: mongoose.Schema.Types.ObjectId, ref: "GroupAccount" },
    fsCode: { type: String },
    mainAcctNo: { type: String },
    subAcctNo: { type: String },
    branchCode: { type: String },
    sequence: { type: String },
    parent: { type: String },
    indention: { type: String },
    detailed: { type: Boolean },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

chartOfAccountSchema.set("toJSON", {
  transform: (doc, ret) => {
    delete ret.updatedAt;
    delete ret.__v;
    return ret;
  },
});

const ChartOfAccount = mongoose.model("ChartOfAccount", chartOfAccountSchema);

module.exports = ChartOfAccount;
