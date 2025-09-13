const { default: mongoose } = require("mongoose");

const loginLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    deviceName: { type: String },
    lastLogin: { type: Date },
  },
  {
    timestamps: true,
  }
);

loginLogSchema.set("toJSON", {
  transform: (doc, ret) => {
    delete ret.updatedAt;
    delete ret.__v;
    return ret;
  },
});

const LoginLog = mongoose.model("LoginLog", loginLogSchema);

module.exports = LoginLog;
