const mongoose = require("mongoose");

const statusSchema = new mongoose.Schema(
  {
    code: { type: String },
    description: { type: String },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

statusSchema.set("toJSON", {
  transform: (doc, ret) => {
    delete ret.updatedAt;
    delete ret.__v;
    return ret;
  },
});

const Status = mongoose.model("Status", statusSchema);

module.exports = Status;
