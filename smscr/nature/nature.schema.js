const mongoose = require("mongoose");

const natureSchema = new mongoose.Schema(
  {
    nature: { type: String },
    description: { type: String },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

natureSchema.set("toJSON", {
  transform: (doc, ret) => {
    delete ret.updatedAt;
    delete ret.__v;
    return ret;
  },
});

const Nature = mongoose.model("Nature", natureSchema);

module.exports = Nature;
