const mongoose = require("mongoose");

const beneficiarySchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" },
    name: { type: String },
    relationship: { type: String },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

beneficiarySchema.set("toJSON", {
  transform: (doc, ret) => {
    delete ret.updatedAt;
    delete ret.__v;
    return ret;
  },
});

const Beneficiary = mongoose.model("Beneficiary", beneficiarySchema);

module.exports = Beneficiary;
