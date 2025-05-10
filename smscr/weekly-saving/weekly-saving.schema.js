const mongoose = require("mongoose");

const weeklySavingSchema = new mongoose.Schema(
  {
    rangeAmountFrom: { type: Number },
    rangeAmountTo: { type: Number },
    weeklySavingsFund: { type: Number },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

weeklySavingSchema.set("toJSON", {
  transform: (doc, ret) => {
    delete ret.updatedAt;
    delete ret.__v;
    return ret;
  },
});

const WeeklySaving = mongoose.model("WeeklySaving", weeklySavingSchema);

module.exports = WeeklySaving;
