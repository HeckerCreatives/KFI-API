const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema(
  {
    name: { type: String },
    address: { type: String },
    city: { type: String },
    telNo: { type: String },
    mobileNo: { type: String },
    zipCode: { type: String },
    birthdate: { type: Date },
    birthplace: { type: String },
    spouse: { type: String },
    memberStatus: { type: String },
    groupNumber: { type: mongoose.Schema.Types.ObjectId, ref: "GroupAccount" },
    civilStatus: { type: String },
    center: { type: mongoose.Schema.Types.ObjectId, ref: "Center" },
    dateRelease: { type: Date },
    business: { type: mongoose.Schema.Types.ObjectId, ref: "BusinessType" },
    position: { type: String },
    age: { type: Number },
    acctOfficer: { type: String },
    acctNumber: { type: String },
    sex: { type: String },
    dateResigned: { type: String },
    newStatus: { type: String },
    reason: { type: String },
    parent: { type: String },
    deletedAt: { type: Date },
    beneficiaries: [{ type: mongoose.Schema.Types.ObjectId, ref: "Beneficiary" }],
    children: [{ type: mongoose.Schema.Types.ObjectId, ref: "Children" }],
  },
  { timestamps: true }
);

customerSchema.set("toJSON", {
  transform: (doc, ret) => {
    delete ret.updatedAt;
    delete ret.__v;
    return ret;
  },
});

const Customer = mongoose.model("Customer", customerSchema);

module.exports = Customer;
