const mongoose = require("mongoose");

const groupAccountSchema = new mongoose.Schema(
  {
    code: { type: String },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

groupAccountSchema.set("toJSON", {
  transform: (doc, ret) => {
    delete ret.updatedAt;
    delete ret.__v;
    return ret;
  },
});

const GroupAccount = mongoose.model("GroupAccount", groupAccountSchema);

module.exports = GroupAccount;
