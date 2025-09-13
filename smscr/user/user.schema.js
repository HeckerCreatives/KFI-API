const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const CustomError = require("../../utils/custom-error");
const { ALL_RESOURCES } = require("../../constants/resources");

const permissionSchema = new mongoose.Schema({
  resource: {
    type: String,
    required: true,
    enum: ALL_RESOURCES,
  },
  actions: {
    create: { type: Boolean, required: true, default: false },
    update: { type: Boolean, required: true, default: false },
    delete: { type: Boolean, required: true, default: false },
    view: { type: Boolean, required: true, default: false },
    print: { type: Boolean, required: true, default: false },
    export: { type: Boolean, required: true, default: false },
    visible: { type: Boolean, required: true, default: false },
  },
});

const userSchema = new mongoose.Schema(
  {
    name: { type: String },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["superadmin", "user"] },
    status: { type: String, enum: ["active", "inactive", "banned"], default: "active" },
    platform: { type: String, enum: ["desktop", "tablet"], default: "desktop" },
    permissions: {
      type: [permissionSchema],
      default: ALL_RESOURCES.map(resource => ({
        resource,
        actions: {
          create: false,
          update: false,
          delete: false,
          view: false,
          print: false,
          export: false,
          visible: false,
        },
      })),
    },
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
