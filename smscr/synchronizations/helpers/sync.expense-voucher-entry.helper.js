const CustomError = require("../../../utils/custom-error");
const ExpenseVoucherEntry = require("../../expense-voucher/entries/expense-voucher-entries.schema");
const activityLogServ = require("../../activity-logs/activity-log.service.js");

exports.createExpenseVoucherEntriesHelper = async (expenseVoucher, expenseVoucherEntries, author, session) => {
  const entries = expenseVoucherEntries.map(entry => ({
    line: entry.line,
    expenseVoucher: expenseVoucher._id,
    client: entry.client || null,
    particular: entry.particular,
    acctCode: entry.acctCodeId,
    debit: entry.debit,
    credit: entry.credit,
    cvForRecompute: entry.cvForRecompute,
    encodedBy: author._id,
  }));

  const addedEntries = await ExpenseVoucherEntry.insertMany(entries, { session });
  if (addedEntries.length !== entries.length) {
    throw new CustomError("Failed to save expense voucher");
  }

  const ids = addedEntries.map(entry => entry._id);
  await activityLogServ.bulk_create({
    ids,
    author: author._id,
    username: author.username,
    activity: `created a expense voucher entry`,
    resource: `expense voucher - entry`,
    session,
  });
};

exports.updateExpenseVoucherEntriesHelper = async (expenseVoucher, expenseVoucherEntries, author, session) => {
  const setters = expenseVoucherEntries.map(entry => ({
    updateOne: {
      filter: { _id: entry._id, expenseVoucher: expenseVoucher._id },
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

  const updates = await ExpenseVoucherEntry.bulkWrite(setters, { session });

  if (updates.modifiedCount + updates.upsertedCount !== expenseVoucherEntries.length) {
    throw new CustomError("Failed to sync expense vouchers. Please try again.", 500);
  }

  const ids = expenseVoucherEntries.map(e => e._id);
  await activityLogServ.bulk_create({
    ids,
    author: author._id,
    username: author.username,
    activity: `updated a expense voucher - entry`,
    resource: `expense voucher - entry`,
    session,
  });
};

exports.deleteExpenseVoucherEntriesHelper = async (expenseVoucher, expenseVoucherEntries, author, session) => {
  const ids = expenseVoucherEntries.map(e => e._id);
  const deleted = await ExpenseVoucherEntry.updateMany(
    { _id: { $in: ids }, expenseVoucher: expenseVoucher._id },
    { $set: { deletedAt: new Date().toISOString() } },
    { session }
  ).exec();

  if (deleted.matchedCount !== ids.length) {
    throw new CustomError("Failed to sync expense voucher entries. Please try again", 500);
  }

  await activityLogServ.bulk_create({
    ids,
    author: author._id,
    username: author.username,
    activity: `deleted a expense voucher - entry`,
    resource: `expense voucher - entry`,
    session,
  });
};
