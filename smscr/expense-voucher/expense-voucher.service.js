const CustomError = require("../../utils/custom-error.js");
const ExpenseVoucherEntry = require("./entries/expense-voucher-entries.schema.js");
const ExpenseVoucher = require("./expense-voucher.schema.js");
const activityLogServ = require("../activity-logs/activity-log.service.js");
const { default: mongoose } = require("mongoose");

exports.get_selections = async (keyword, limit, page, offset) => {
  const filter = { deletedAt: null, code: new RegExp(keyword, "i") };

  const expenseVouchersPromise = ExpenseVoucher.find(filter, { code: 1 }).skip(offset).limit(limit).lean().exec();
  const countPromise = ExpenseVoucher.countDocuments(filter);

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

exports.get_all = async (limit, page, offset, keyword, sort, to, from) => {
  const filter = { deletedAt: null };
  if (keyword) filter.code = new RegExp(keyword, "i");

  if (to && from) {
    filter.date = { $gte: new Date(from), $lte: new Date(to) };
  } else if (to) {
    filter.date = { $lte: new Date(to) };
  } else if (from) {
    filter.date = { $gte: new Date(from) };
  }

  const query = ExpenseVoucher.find(filter);
  if (sort && ["code-asc", "code-desc"].includes(sort)) {
    query.sort({ code: sort === "code-asc" ? 1 : -1 });
  } else {
    query.sort({ createdAt: -1 });
  }

  const countPromise = ExpenseVoucher.countDocuments(filter);
  const expenseVouchersPromise = query
    .populate({ path: "bankCode", select: "code description" })
    .populate({ path: "supplier", select: "code description" })
    .populate({ path: "encodedBy", select: "-_id username" })
    .skip(offset)
    .limit(limit)
    .exec();

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

exports.create = async (data, author) => {
  const newExpenseVoucher = await new ExpenseVoucher({
    code: data.code.toUpperCase(),
    supplier: data.supplierId,
    date: data.date,
    acctMonth: data.acctMonth,
    acctYear: data.acctYear,
    refNo: data.refNo,
    checkNo: data.checkNo,
    checkDate: data.checkDate,
    bankCode: data.bank,
    amount: data.amount,
    remarks: data.remarks,
    encodedBy: author._id,
  }).save();
  if (!newExpenseVoucher) {
    throw new CustomError("Failed to create a new expense voucher", 500);
  }

  const entries = data.entries.map(entry => ({
    expenseVoucher: newExpenseVoucher._id,
    client: entry.client || null,
    particular: entry.particular,
    acctCode: entry.acctCodeId,
    debit: entry.debit,
    credit: entry.credit,
    cvForRecompute: entry.cvForRecompute,
    encodedBy: author._id,
  }));

  const addedEntries = await ExpenseVoucherEntry.insertMany(entries);

  if (addedEntries.length !== entries.length) {
    throw new CustomError("Failed to save expense voucher");
  }

  const _ids = addedEntries.map(entry => entry._id);

  const expenseVoucher = await ExpenseVoucher.findById(newExpenseVoucher._id)
    .populate({ path: "bankCode", select: "code description" })
    .populate({ path: "supplier", select: "code description" })
    .populate({ path: "encodedBy", select: "-_id username" })
    .exec();

  await activityLogServ.create({
    author: author._id,
    username: author.username,
    activity: `created an expense voucher`,
    resource: `expense voucher`,
    dataId: expenseVoucher._id,
  });

  await Promise.all(
    _ids.map(async id => {
      await activityLogServ.create({
        author: author._id,
        username: author.username,
        activity: `created a expense voucher entry`,
        resource: `expense voucher - entry`,
        dataId: id,
      });
    })
  );

  return {
    success: true,
    expenseVoucher: newExpenseVoucher,
  };
};

exports.update = async (filter, data, author) => {
  const updatedExpenseVoucher = await ExpenseVoucher.findOneAndUpdate(
    filter,
    {
      $set: {
        code: data.code.toUpperCase(),
        supplier: data.supplierId,
        date: data.date,
        acctMonth: data.acctMonth,
        acctYear: data.acctYear,
        refNo: data.refNo,
        checkNo: data.checkNo,
        checkDate: data.checkDate,
        bankCode: data.bank,
        amount: data.amount,
        remarks: data.remarks,
      },
    },
    { new: true }
  )
    .populate({ path: "bankCode", select: "code description" })
    .populate({ path: "supplier", select: "code description" })
    .populate({ path: "encodedBy", select: "-_id username" })
    .lean()
    .exec();
  if (!updatedExpenseVoucher) {
    throw new CustomError("Failed to update the expense voucher", 500);
  }

  await activityLogServ.create({
    author: author._id,
    username: author.username,
    activity: `updated an expense voucher`,
    resource: `expense voucher`,
    dataId: updatedExpenseVoucher._id,
  });

  return { success: true, expenseVoucher: updatedExpenseVoucher };
};

exports.delete = async (filter, author) => {
  const deleted = await ExpenseVoucher.findOneAndUpdate(filter, { $set: { deletedAt: new Date().toISOString() } }).exec();
  if (!deleted) throw new CustomError("Failed to delete the expense voucher", 500);

  await ExpenseVoucherEntry.updateMany({ expenseVoucher: deleted._id }, { $set: { deletedAt: new Date().toISOString() } }).exec();

  await activityLogServ.create({
    author: author._id,
    username: author.username,
    activity: `deleted an expense voucher along with its linked gl entries`,
    resource: `expense voucher`,
    dataId: deleted._id,
  });

  return { success: true, expenseVoucher: filter._id };
};

exports.print_all_detailed = async (docNoFrom, docNoTo) => {
  const pipelines = [];
  const filter = { deletedAt: null };
  if (docNoFrom || docNoTo) filter.$and = [];
  if (docNoFrom) filter.$and.push({ code: { $gte: docNoFrom } });
  if (docNoTo) filter.$and.push({ code: { $lte: docNoTo } });

  pipelines.push({ $match: filter });

  pipelines.push({ $sort: { code: 1 } });

  pipelines.push({ $lookup: { from: "banks", localField: "bankCode", foreignField: "_id", as: "bankCode", pipeline: [{ $project: { code: 1, description: 1 } }] } });

  pipelines.push({ $lookup: { from: "suppliers", localField: "supplier", foreignField: "_id", as: "supplier", pipeline: [{ $project: { code: 1, description: 1 } }] } });

  pipelines.push({ $addFields: { bankCode: { $arrayElemAt: ["$bankCode", 0] }, supplier: { $arrayElemAt: ["$supplier", 0] } } });

  pipelines.push({
    $lookup: {
      from: "expensevoucherentries",
      let: { localField: "$_id" },
      pipeline: [
        { $match: { $expr: { $eq: ["$$localField", "$expenseVoucher"] }, deletedAt: null } },
        { $lookup: { from: "chartofaccounts", localField: "acctCode", foreignField: "_id", as: "acctCode", pipeline: [{ $project: { code: 1, description: 1 } }] } },
        { $addFields: { acctCode: { $arrayElemAt: ["$acctCode", 0] } } },
        { $project: { createdAt: 0, updatedAt: 0, __v: 0, encodedBy: 0, expenseVoucher: 0 } },
      ],
      as: "entries",
    },
  });

  pipelines.push({ $project: { createdAt: 0, updatedAt: 0, __v: 0, type: 0, encodedBy: 0 } });

  const expenseVouchers = await ExpenseVoucher.aggregate(pipelines).exec();

  return expenseVouchers;
};

exports.print_detailed_by_id = async expenseVoucherId => {
  const pipelines = [];
  const filter = { deletedAt: null, _id: new mongoose.Types.ObjectId(expenseVoucherId) };

  pipelines.push({ $match: filter });

  pipelines.push({ $sort: { code: 1 } });

  pipelines.push({ $lookup: { from: "banks", localField: "bankCode", foreignField: "_id", as: "bankCode", pipeline: [{ $project: { code: 1, description: 1 } }] } });

  pipelines.push({ $lookup: { from: "suppliers", localField: "supplier", foreignField: "_id", as: "supplier", pipeline: [{ $project: { code: 1, description: 1 } }] } });

  pipelines.push({ $addFields: { bankCode: { $arrayElemAt: ["$bankCode", 0] }, supplier: { $arrayElemAt: ["$supplier", 0] } } });

  pipelines.push({
    $lookup: {
      from: "expensevoucherentries",
      let: { localField: "$_id" },
      pipeline: [
        { $match: { $expr: { $eq: ["$$localField", "$expenseVoucher"] }, deletedAt: null } },
        { $lookup: { from: "chartofaccounts", localField: "acctCode", foreignField: "_id", as: "acctCode", pipeline: [{ $project: { code: 1, description: 1 } }] } },
        { $addFields: { acctCode: { $arrayElemAt: ["$acctCode", 0] } } },
        { $project: { createdAt: 0, updatedAt: 0, __v: 0, encodedBy: 0, expenseVoucher: 0 } },
      ],
      as: "entries",
    },
  });

  pipelines.push({ $project: { createdAt: 0, updatedAt: 0, __v: 0, type: 0, encodedBy: 0 } });

  const expenseVouchers = await ExpenseVoucher.aggregate(pipelines).exec();

  return expenseVouchers;
};

exports.print_all_summary = async (docNoFrom, docNoTo) => {
  const filter = { deletedAt: null };
  if (docNoFrom || docNoTo) filter.$and = [];
  if (docNoFrom) filter.$and.push({ code: { $gte: docNoFrom } });
  if (docNoTo) filter.$and.push({ code: { $lte: docNoTo } });
  const expenseVouchers = await ExpenseVoucher.find(filter).populate({ path: "bankCode" }).populate({ path: "supplier" }).sort({ code: 1 });
  return expenseVouchers;
};

exports.print_summary_by_id = async expenseVoucherId => {
  const filter = { deletedAt: null, _id: expenseVoucherId };
  const expenseVouchers = await ExpenseVoucher.find(filter).populate({ path: "bankCode" }).populate({ path: "supplier" }).sort({ code: 1 });
  return expenseVouchers;
};
