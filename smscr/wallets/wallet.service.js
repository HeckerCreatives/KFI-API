const CustomError = require("../../utils/custom-error.js");
const Wallet = require("./wallet.schema.js");

exports.upsertWallet = async (client, type, amount, session = null) => {
  try {
    const filter = { owner: client, type };
    const updates = { $set: { owner: client, type, amount } };
    const options = session ? { session } : {};

    const wallet = await Wallet.findOne(filter).lean().exec();

    if (wallet) {
      await Wallet.updateOne(filter, updates, options);
    } else {
      await new Wallet({ owner: client, type, amount }).save(options);
    }
  } catch (error) {
    console.log(error);
    throw new CustomError("Failed to create loan release", 500);
  }
};
