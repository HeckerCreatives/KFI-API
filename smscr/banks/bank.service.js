const CustomError = require("../../utils/custom-error.js");
const Bank = require("./bank.schema.js");

exports.get_all = async (limit, page, offset, keyword, sort) => {
  const filter = { deletedAt: null };
  if (keyword) filter.$or = [{ code: new RegExp(keyword, "i") }, { description: new RegExp(keyword, "i") }];

  const query = Bank.find(filter);
  if (sort && ["code-asc", "code-desc"].includes(sort)) query.sort({ code: sort === "code-asc" ? 1 : -1 });
  else if (sort && ["description-asc", "description-desc"].includes(sort)) query.sort({ description: sort === "description-asc" ? 1 : -1 });
  else query.sort({ createdAt: -1 });

  const countPromise = Bank.countDocuments(filter);
  const banksPromise = query.skip(offset).limit(limit).exec();

  const [count, banks] = await Promise.all([countPromise, banksPromise]);

  const hasNextPage = count > offset + limit;
  const hasPrevPage = page > 1;
  const totalPages = Math.ceil(count / limit);

  return {
    success: true,
    banks,
    hasNextPage,
    hasPrevPage,
    totalPages,
  };
};

exports.get_single = async filter => {
  const bank = await Bank.findOne(filter).exec();
  if (!bank) {
    throw new CustomError("Bank not found", 404);
  }
  return { success: true, bank };
};

exports.create = async data => {
  const newBank = await new Bank({
    code: data.code.toUpperCase(),
    description: data.description,
  }).save();
  if (!newBank) {
    throw new CustomError("Failed to create a new bank", 500);
  }
  return {
    success: true,
    bank: newBank,
  };
};

exports.update = async (filter, data) => {
  const updatedBank = await Bank.findOneAndUpdate(
    filter,
    {
      $set: {
        code: data.code.toUpperCase(),
        description: data.description,
      },
    },
    { new: true }
  ).exec();
  if (!updatedBank) {
    throw new CustomError("Failed to update the bank", 500);
  }
  return { success: true, bank: updatedBank };
};

exports.delete = async filter => {
  const deletedBank = await Bank.updateOne(filter, { $set: { deletedAt: new Date().toISOString() } }).exec();
  if (!deletedBank.acknowledged || deletedBank.modifiedCount < 1) {
    throw new CustomError("Failed to delete the bank", 500);
  }
  return { success: true, bank: filter._id };
};
