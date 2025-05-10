const mongoose = require("mongoose");

const weeklySavingTimeSchema = new mongoose.Schema(
  {
    week: { type: String },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

weeklySavingTimeSchema.set("toJSON", {
  transform: (doc, ret) => {
    delete ret.updatedAt;
    delete ret.__v;
    return ret;
  },
});

const WeeklySavingTime = mongoose.model("WeeklySavingTime", weeklySavingTimeSchema);

module.exports = WeeklySavingTime;
