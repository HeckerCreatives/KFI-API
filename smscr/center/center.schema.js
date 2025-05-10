const mongoose = require("mongoose");

const centerSchema = new mongoose.Schema(
  {
    centerNo: { type: String },
    description: { type: String },
    location: { type: String },
    centerChief: { type: String },
    treasurer: { type: String },
    acctOfficer: { type: String },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

centerSchema.set("toJSON", {
  transform: (doc, ret) => {
    delete ret.updatedAt;
    delete ret.__v;
    return ret;
  },
});

const Center = mongoose.model("Center", centerSchema);

module.exports = Center;
