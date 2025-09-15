const mongoose = require("mongoose");
const { signatureType } = require("../../constants/signature-type");

const signatureParamSchema = new mongoose.Schema(
  {
    type: { type: String, required: true, unique: true, enum: signatureType },
    approvedBy: { type: String },
    checkedBy: { type: String },
    verifiedBy: { type: String },
    notedBy: { type: String },
  },
  { timestamps: true }
);

const SignatureParam = mongoose.model("SignatureParam", signatureParamSchema);

module.exports = SignatureParam;
