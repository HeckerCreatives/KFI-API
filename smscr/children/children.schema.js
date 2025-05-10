const mongoose = require("mongoose");

const childrenSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" },
    name: { type: String },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

childrenSchema.set("toJSON", {
  transform: (doc, ret) => {
    delete ret.updatedAt;
    delete ret.__v;
    return ret;
  },
});

const Children = mongoose.model("Children", childrenSchema);

module.exports = Children;
