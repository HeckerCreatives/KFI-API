const mongoose = require("mongoose");

const businessTypeSchema = new mongoose.Schema(
  {
    type: { type: String },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

businessTypeSchema.set("toJSON", {
  transform: (doc, ret) => {
    delete ret.updatedAt;
    delete ret.__v;
    return ret;
  },
});

const BusinessType = mongoose.model("BusinessType", businessTypeSchema);

module.exports = BusinessType;
