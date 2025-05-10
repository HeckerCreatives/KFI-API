const mongoose = require("mongoose");

const bankSchema = new mongoose.Schema(
  {
    code: { type: String },
    description: { type: String },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

bankSchema.set("toJSON", {
  transform: (doc, ret) => {
    delete ret.updatedAt;
    delete ret.__v;
    return ret;
  },
});

const Bank = mongoose.model("Bank", bankSchema);

module.exports = Bank;
