const ExpenseVoucher = require("../expense-voucher.schema.js");
const ExpenseVoucherEntry = require("./expense-voucher-entries.schema.js");
const activityLogServ = require("../../activity-logs/activity-log.service.js");

exports.get_all_no_pagination = async expenseVoucher => {
  const filter = { deletedAt: null, expenseVoucher };

  const entries = await ExpenseVoucherEntry.find(filter)
    .sort("-createdAt")
    .populate({ path: "acctCode", select: "code description" })
    .populate({ path: "client", select: "name", populate: { path: "center", select: "centerNo" } });

  return {
    success: true,
    entries,
  };
};

exports.get_all = async (limit, page, offset, expenseVoucher) => {
  const filter = { deletedAt: null, expenseVoucher };

  const query = ExpenseVoucherEntry.find(filter)
    .sort("-createdAt")
    .populate({ path: "acctCode", select: "code description" })
    .populate({ path: "client", select: "name", populate: { path: "center", select: "centerNo" } });

  const countPromise = ExpenseVoucherEntry.countDocuments(filter);
  const entriesPromise = query.skip(offset).limit(limit).exec();

  const [count, entries] = await Promise.all([countPromise, entriesPromise]);

  const hasNextPage = count > offset + limit;
  const hasPrevPage = page > 1;
  const totalPages = Math.ceil(count / limit);

  return {
    success: true,
    entries,
    hasNextPage,
    hasPrevPage,
    totalPages,
  };
};

exports.create = async (expenseVoucherId, data, author) => {
  const expenseVoucher = await ExpenseVoucher.findById(expenseVoucherId).lean().exec();

  const newEntry = await new ExpenseVoucherEntry({
    expenseVoucher: expenseVoucher._id,
    acctCode: data.acctCodeId,
    client: data.client || null,
    particular: data.particular || null,
    debit: data.debit,
    credit: data.credit,
    cvForRecompute: data.cvForRecompute,
    encodedBy: author._id,
  }).save();

  if (!newEntry) {
    throw new CustomError("Failed to create a new entry", 500);
  }

  await activityLogServ.create({
    author: author._id,
    username: author.username,
    activity: `created a expense voucher gl entries`,
    resource: `expense voucher - entry`,
    dataId: newEntry._id,
  });

  const entry = await ExpenseVoucherEntry.findById(newEntry._id).populate({ path: "acctCode", select: "code description" }).lean().exec();

  return {
    success: true,
    entry,
  };
};

exports.update = async (expenseVoucherId, entryId, data, author) => {
  const updated = await ExpenseVoucherEntry.findOneAndUpdate(
    { _id: entryId, expenseVoucher: expenseVoucherId },
    {
      $set: {
        acctCode: data.acctCodeId,
        client: data.client || null,
        particular: data.particular || null,
        debit: data.debit,
        credit: data.credit,
        cvForRecompute: data.cvForRecompute,
      },
    },
    { new: true }
  )
    .populate({ path: "acctCode", select: "code description" })
    .populate({ path: "client", select: "name", populate: { path: "center", select: "centerNo" } })
    .lean()
    .exec();

  if (!updated) {
    throw new CustomError("Failed to update the entry", 500);
  }

  await activityLogServ.create({
    author: author._id,
    username: author.username,
    activity: `updated a expense voucher gl entries`,
    resource: `expense voucher - entry`,
    dataId: updated._id,
  });

  return {
    success: true,
    entry: updated,
  };
};

exports.delete = async (filter, author) => {
  const deletedEntry = await ExpenseVoucherEntry.findOneAndUpdate(filter, { $set: { deletedAt: new Date().toISOString() } }).exec();
  if (!deletedEntry) {
    throw new CustomError("Failed to delete the entry", 500);
  }

  await activityLogServ.create({
    author: author._id,
    username: author.username,
    activity: `deleted a gl entry in expense voucher`,
    resource: `expense voucher - entry`,
    dataId: deletedEntry._id,
  });

  return { success: true, entry: filter._id };
};
