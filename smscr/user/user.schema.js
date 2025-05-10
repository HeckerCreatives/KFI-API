const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const CustomError = require("../../utils/custom-error");

const userSchema = new mongoose.Schema(
  {
    name: { type: String },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["superadmin", "admin"] },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

userSchema.methods.matchPassword = async function (password) {
  try {
    return await bcrypt.compare(password, this.password);
  } catch (error) {
    throw new CustomError("Password comparison failed", 500);
  }
};

userSchema.methods.savePassword = async function (password) {
  try {
    this.password = await bcrypt.hash(password, 10);
  } catch (error) {
    console.log(error);
    throw new CustomError("Password hashing failed", 500);
  }
};

userSchema.set("toJSON", {
  transform: (doc, ret) => {
    delete ret.updatedAt;
    delete ret.__v;
    delete ret.password;
    delete ret.secretQuestion;
    delete ret.secretAnswer;
    return ret;
  },
});

const User = mongoose.model("User", userSchema);

module.exports = User;
