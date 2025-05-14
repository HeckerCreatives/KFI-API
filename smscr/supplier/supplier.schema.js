const mongoose = require("mongoose");

const supplierSchema = new mongoose.Schema(
  {
    code: { type: String },
    description: { type: String },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

supplierSchema.set("toJSON", {
  transform: (doc, ret) => {
    delete ret.deleted;
    delete ret.updatedAt;
    delete ret.__v;
    return ret;
  },
});

const Supplier = mongoose.model("Supplier", supplierSchema);

module.exports = Supplier;
