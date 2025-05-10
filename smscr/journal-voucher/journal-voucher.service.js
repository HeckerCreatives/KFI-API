const CustomError = require("../../utils/custom-error.js");
const JournalVoucher = require("./journal-voucher.schema.js");

exports.get_all = async (limit, page, offset, keyword) => {
  const filter = { deletedAt: null };
  if (keyword) filter.code = new RegExp(keyword, "i");

  const countPromise = JournalVoucher.countDocuments(filter);
  const journalVouchersPromise = JournalVoucher.find(filter).skip(offset).limit(limit).exec();

  const [count, journalVouchers] = await Promise.all([countPromise, journalVouchersPromise]);

  const hasNextPage = count > offset + limit;
  const hasPrevPage = page > 1;
  const totalPages = Math.ceil(count / limit);

  return {
    success: true,
    journalVouchers,
    hasNextPage,
    hasPrevPage,
    totalPages,
  };
};

exports.get_single = async filter => {
  const journalVoucher = await JournalVoucher.findOne(filter).exec();
  if (!journalVoucher) {
    throw new CustomError("Journal voucher not found", 404);
  }
  return { success: true, journalVoucher };
};

exports.create = async data => {
  const newJournalVoucher = await new JournalVoucher({
    jvNo: data.jvNo,
    supplier: data.supplier,
    nature: data.nature,
    remarks: data.remarks,
    date: data.date,
    acctMonth: data.acctMonth,
    acctYear: data.acctYear,
    checkNo: data.checkNo,
    checkDate: data.checkDate,
    bankCode: data.bankCode,
    amount: data.amount,
  }).save();
  if (!newJournalVoucher) {
    throw new CustomError("Failed to create a new journal voucher", 500);
  }
  return {
    success: true,
    journalVoucher: newJournalVoucher,
  };
};

exports.update = async (filter, data) => {
  const updatedJournalVoucher = await JournalVoucher.findOneAndUpdate(
    filter,
    {
      $set: {
        jvNo: data.jvNo,
        supplier: data.supplier,
        nature: data.nature,
        remarks: data.remarks,
        date: data.date,
        acctMonth: data.acctMonth,
        acctYear: data.acctYear,
        checkNo: data.checkNo,
        checkDate: data.checkDate,
        bankCode: data.bankCode,
        amount: data.amount,
      },
    },
    { new: true }
  ).exec();
  if (!updatedJournalVoucher) {
    throw new CustomError("Failed to update the journal voucher", 500);
  }
  return { success: true, journalVoucher: updatedJournalVoucher };
};

exports.delete = async filter => {
  const deletedJournalVoucher = await JournalVoucher.updateOne(filter, { $set: { deletedAt: new Date().toISOString() } }).exec();
  if (!deletedJournalVoucher.acknowledged || deletedJournalVoucher.modifiedCount < 1) {
    throw new CustomError("Failed to delete the jounal voucher", 500);
  }
  return { success: true, journalVoucher: filter._id };
};
