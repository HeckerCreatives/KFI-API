const CustomError = require("../../utils/custom-error.js");
const ExpenseVoucherEntry = require("./entries/expense-voucher-entries.schema.js");
const ExpenseVoucher = require("./expense-voucher.schema.js");
const activityLogServ = require("../activity-logs/activity-log.service.js");
const { default: mongoose } = require("mongoose");
const { isAmountTally } = require("../../utils/tally-amount.js");
const SignatureParam = require("../system-parameters/signature-param.js");

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
  const signature = await SignatureParam.findOne({ type: "expense voucher" }).lean().exec();

  const newExpenseVoucher = await new ExpenseVoucher({
    code: data.code.toUpperCase(),
    supplier: data.supplier,
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
    preparedBy: author.username,
    checkedBy: signature.checkedBy,
    approvedBy: signature.approvedBy,
    receivedBy: signature.receivedBy,
  }).save();

  if (!newExpenseVoucher) {
    throw new CustomError("Failed to create a new expense voucher", 500);
  }

  const entries = data.entries.map(entry => ({
    line: entry.line,
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
  const entryToUpdate = data.entries.filter(entry => entry._id);
  const entryToCreate = data.entries.filter(entry => !entry._id);

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const updatedExpenseVoucher = await ExpenseVoucher.findOneAndUpdate(
      filter,
      {
        $set: {
          code: data.code.toUpperCase(),
          supplier: data.supplier,
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
      .populate({ path: "encodedBy", select: "-_id username" })
      .session(session)
      .lean()
      .exec();

    if (!updatedExpenseVoucher) {
      throw new CustomError("Failed to update the expense voucher", 500);
    }

    if (entryToCreate.length > 0) {
      const newEntries = entryToCreate.map(entry => ({
        line: entry.line,
        expenseVoucher: updatedExpenseVoucher._id,
        client: entry.client || null,
        particular: entry.particular,
        acctCode: entry.acctCodeId,
        debit: entry.debit,
        credit: entry.credit,
        cvForRecompute: entry.cvForRecompute,
        encodedBy: author._id,
      }));

      const added = await ExpenseVoucherEntry.insertMany(newEntries, { session });
      if (added.length !== newEntries.length) {
        throw new CustomError("Failed to update the expense voucher", 500);
      }
    }

    if (data.deletedIds && data.deletedIds.length > 0) {
      const deleted = await ExpenseVoucherEntry.updateMany(
        { _id: { $in: data.deletedIds }, deletedAt: { $exists: false } },
        { deletedAt: new Date().toISOString() },
        { session }
      ).exec();
      if (deleted.matchedCount !== data.deletedIds.length) {
        throw new CustomError("Failed to update the expense voucher", 500);
      }
    }

    if (entryToUpdate.length > 0) {
      const updates = entryToUpdate.map(entry => ({
        updateOne: {
          filter: { _id: entry._id },
          update: {
            $set: {
              line: entry.line,
              client: entry.client || null,
              particular: entry.particular,
              acctCode: entry.acctCodeId,
              debit: entry.debit,
              credit: entry.credit,
              cvForRecompute: entry.cvForRecompute,
            },
          },
        },
      }));
      const updated = await ExpenseVoucherEntry.bulkWrite(updates, { session });
      if (updated.matchedCount !== updates.length) {
        throw new CustomError("Failed to update the expense voucher", 500);
      }
    }

    const latestEntries = await ExpenseVoucherEntry.find({ expenseVoucher: updatedExpenseVoucher._id, deletedAt: null }).populate("acctCode").session(session).lean().exec();

    const { debitCreditBalanced, netDebitCreditBalanced, netAmountBalanced } = isAmountTally(latestEntries, updatedExpenseVoucher.amount);
    if (!debitCreditBalanced) throw new CustomError("Debit and Credit must be balanced.", 400);
    if (!netDebitCreditBalanced) throw new CustomError("Please check all the amount in the entries", 400);
    if (!netAmountBalanced) throw new CustomError("Amount and Net Amount must be balanced", 400);

    await activityLogServ.create({
      author: author._id,
      username: author.username,
      activity: `updated an expense voucher and its entries`,
      resource: `expense voucher`,
      dataId: updatedExpenseVoucher._id,
      session,
    });

    await session.commitTransaction();

    return {
      success: true,
      expenseVoucher: updatedExpenseVoucher,
    };
  } catch (error) {
    await session.abortTransaction();
    throw new CustomError(error.message || "Failed to update expense voucher", error.statusCode || 500);
  } finally {
    await session.endSession();
  }
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

  // pipelines.push({ $lookup: { from: "suppliers", localField: "supplier", foreignField: "_id", as: "supplier", pipeline: [{ $project: { code: 1, description: 1 } }] } });

  pipelines.push({ $addFields: { bankCode: { $arrayElemAt: ["$bankCode", 0] } } });

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

  // pipelines.push({ $lookup: { from: "suppliers", localField: "supplier", foreignField: "_id", as: "supplier", pipeline: [{ $project: { code: 1, description: 1 } }] } });

  pipelines.push({ $addFields: { bankCode: { $arrayElemAt: ["$bankCode", 0] } } });

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

exports.print_file = async transactionId => {
  const expense = await ExpenseVoucher.findOne({ _id: transactionId, deletedAt: null }).populate("supplier").populate("bankCode").lean().exec();
  const entries = await ExpenseVoucherEntry.find({ expenseVoucher: expense._id, deletedAt: null }).populate("client").populate("acctCode").lean().exec();
  let payTo = `${expense.supplier}`;

  return { success: true, expense, entries, payTo };
};
