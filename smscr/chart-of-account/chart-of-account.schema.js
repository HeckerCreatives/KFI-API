const mongoose = require("mongoose");

const chartOfAccountSchema = new mongoose.Schema(
  {
    code: { type: String },
    description: { type: String },
    nature: { type: String },
    classification: { type: String },
    deptStatus: { type: String },
    groupOfAccount: { type: mongoose.Schema.Types.ObjectId, ref: "GroupAccount" },
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
