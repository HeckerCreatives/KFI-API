const CustomError = require("../../utils/custom-error.js");
const OfficialReceipt = require("./official-receipt.schema.js");

exports.get_all = async (limit, page, offset, keyword) => {
  const filter = { deletedAt: null };
  if (keyword) filter.code = new RegExp(keyword, "i");

  const countPromise = OfficialReceipt.countDocuments(filter);
  const officialReceiptsPromise = OfficialReceipt.find(filter).skip(offset).limit(limit).exec();

  const [count, officialReceipts] = await Promise.all([countPromise, officialReceiptsPromise]);

  const hasNextPage = count > offset + limit;
  const hasPrevPage = page > 1;
  const totalPages = Math.ceil(count / limit);

  return {
    success: true,
    officialReceipts,
    hasNextPage,
    hasPrevPage,
    totalPages,
  };
};

exports.get_single = async filter => {
  const officialReceipt = await OfficialReceipt.findOne(filter).exec();
  if (!officialReceipt) {
    throw new CustomError("Official receipt not found", 404);
  }
  return { success: true, officialReceipt };
};

exports.create = async data => {
  const newOfficialReceipt = await new OfficialReceipt({
    orNo: data.jvNo,
    center: data.center,
    date: data.date,
    acctMonth: data.acctMonth,
    checkNo: data.checkNo,
    checkDate: data.checkDate,
    bankCode: data.bankCode,
    amount: data.amount,
  }).save();
  if (!newOfficialReceipt) {
    throw new CustomError("Failed to create a new official receipt", 500);
  }
  return {
    success: true,
    officialReceipt: newOfficialReceipt,
  };
};

exports.update = async (filter, data) => {
  const updatedOfficialReceipt = await OfficialReceipt.findOneAndUpdate(
    filter,
    {
      $set: {
        orNo: data.jvNo,
        center: data.center,
        date: data.date,
        acctMonth: data.acctMonth,
        checkNo: data.checkNo,
        checkDate: data.checkDate,
        bankCode: data.bankCode,
        amount: data.amount,
      },
    },
    { new: true }
  ).exec();
  if (!updatedOfficialReceipt) {
    throw new CustomError("Failed to update the official receipt", 500);
  }
  return { success: true, officialReceipt: updatedOfficialReceipt };
};

exports.delete = async filter => {
  const deletedOfficialReceipt = await OfficialReceipt.updateOne(filter, { $set: { deletedAt: new Date().toISOString() } }).exec();
  if (!deletedOfficialReceipt.acknowledged || deletedOfficialReceipt.modifiedCount < 1) {
    throw new CustomError("Failed to delete the official receipt", 500);
  }
  return { success: true, officialReceipt: filter._id };
};
