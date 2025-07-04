const mongoose = require("mongoose");
const { wallets } = require("../../constants/wallets");

const walletSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true },
    type: { type: String, enum: wallets, required: true },
    amount: { type: Number, default: 0, required: true },
  },
  { timestamps: true }
);

walletSchema.set("toJSON", {
  transform: (ret, doc) => {
    delete ret.updatedAt;
    delete ret.__v;
    delete ret.createdAt;
    return ret;
  },
});

walletSchema.index({ owner: 1, type: 1 }, { unique: true });

const Wallet = mongoose.model("Wallet", walletSchema);

module.exports = Wallet;
