const CustomError = require("../../utils/custom-error.js");
const ExpenseVoucher = require("./expense-voucher.schema.js");

exports.get_all = async (limit, page, offset, keyword) => {
  const filter = { deletedAt: null };
  if (keyword) filter.code = new RegExp(keyword, "i");

  const countPromise = ExpenseVoucher.countDocuments(filter);
  const expenseVouchersPromise = ExpenseVoucher.find(filter).skip(offset).limit(limit).exec();

  const [count, expenseVouchers] = await Promise.all([countPromise, expenseVouchersPromise]);

  const hasNextPage = count > offset + limit;
  const hasPrevPage = page > 1;
  const totalPages = Math.ceil(count / limit);

  return {
    success: true,
    expenseVouchers,
    hasNextPage,
    hasPrevPage,
    totalPages,
  };
};

exports.get_single = async filter => {
  const expenseVoucher = await ExpenseVoucher.findOne(filter).exec();
  if (!expenseVoucher) {
    throw new CustomError("Expense voucher not found", 404);
  }
  return { success: true, expenseVoucher };
};

exports.create = async data => {
  const newExpenseVoucher = await new ExpenseVoucher({
    cvNo: data.cvNo,
    supplier: data.supplier,
    date: data.date,
    acctMonth: data.acctMonth,
    acctYear: data.acctYear,
    checkNo: data.checkNo,
    checkDate: data.checkDate,
    bankCode: data.bankCode,
    amount: data.amount,
    remarks: data.remarks,
  }).save();
  if (!newExpenseVoucher) {
    throw new CustomError("Failed to create a new expense voucher", 500);
  }
  return {
    success: true,
    expenseVoucher: newExpenseVoucher,
  };
};

exports.update = async (filter, data) => {
  const updatedExpenseVoucher = await ExpenseVoucher.findOneAndUpdate(
    filter,
    {
      $set: {
        cvNo: data.cvNo,
        supplier: data.supplier,
        date: data.date,
        acctMonth: data.acctMonth,
        acctYear: data.acctYear,
        checkNo: data.checkNo,
        checkDate: data.checkDate,
        bankCode: data.bankCode,
        amount: data.amount,
        remarks: data.remarks,
      },
    },
    { new: true }
  ).exec();
  if (!updatedExpenseVoucher) {
    throw new CustomError("Failed to update the expense voucher", 500);
  }
  return { success: true, expenseVoucher: updatedExpenseVoucher };
};

exports.delete = async filter => {
  const deletedExpenseVoucher = await ExpenseVoucher.updateOne(filter, { $set: { deletedAt: new Date().toISOString() } }).exec();
  if (!deletedExpenseVoucher.acknowledged || deletedExpenseVoucher.modifiedCount < 1) {
    throw new CustomError("Failed to delete the expense voucher", 500);
  }
  return { success: true, expenseVoucher: filter._id };
};
