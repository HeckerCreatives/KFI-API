const mongoose = require("mongoose");
const Customer = require("../customer/customer.schema");
const CustomError = require("../../utils/custom-error");

const childrenSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" },
    name: { type: String },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

childrenSchema.post("save", async function (doc) {
  try {
    const session = doc.$session();
    const options = session ? { session } : {};
    await Customer.updateOne({ _id: doc.owner }, { $push: { children: doc._id } }, options).exec();
  } catch (error) {
    throw new CustomError("Failed to add children", 500);
  }
});

childrenSchema.post("updateOne", async function (doc) {
  try {
    const session = this.getOptions().session;
    const filter = this.getFilter();
    const update = this.getUpdate();
    const options = session ? { session } : {};
    const isSoftDelete = update.$set?.deletedAt || update.deletedAt || (typeof update === "object" && update.deletedAt);
    if (!isSoftDelete) return;
    await Customer.updateOne({ children: filter._id }, { $pull: { children: filter._id } }, options).exec();
  } catch (error) {
    throw new CustomError("Failed to delete the children", 500);
  }
});

childrenSchema.set("toJSON", {
  transform: (doc, ret) => {
    delete ret.updatedAt;
    delete ret.__v;
    return ret;
  },
});

const Children = mongoose.model("Children", childrenSchema);

module.exports = Children;
