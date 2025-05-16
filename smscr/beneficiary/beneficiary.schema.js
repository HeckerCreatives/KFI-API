const mongoose = require("mongoose");
const Customer = require("../customer/customer.schema");
const CustomError = require("../../utils/custom-error");

const beneficiarySchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" },
    name: { type: String },
    relationship: { type: String },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

beneficiarySchema.post("save", async function (doc) {
  try {
    const session = doc.$session();
    const options = session ? { session } : {};
    await Customer.updateOne({ _id: doc.owner }, { $push: { beneficiaries: doc._id } }, options).exec();
  } catch (error) {
    throw new CustomError("Failed to add beneficiary", 500);
  }
});

beneficiarySchema.post("updateOne", async function (doc) {
  try {
    const session = this.getOptions().session;
    const filter = this.getFilter();
    const update = this.getUpdate();
    const options = session ? { session } : {};
    const isSoftDelete = update.$set?.deletedAt || update.deletedAt || (typeof update === "object" && update.deletedAt);
    if (!isSoftDelete) return;
    await Customer.updateOne({ beneficiaries: filter._id }, { $pull: { beneficiaries: filter._id } }, options).exec();
  } catch (error) {
    throw new CustomError("Failed to delete the beneficiary", 500);
  }
});

beneficiarySchema.set("toJSON", {
  transform: (doc, ret) => {
    delete ret.updatedAt;
    delete ret.__v;
    return ret;
  },
});

const Beneficiary = mongoose.model("Beneficiary", beneficiarySchema);

module.exports = Beneficiary;
