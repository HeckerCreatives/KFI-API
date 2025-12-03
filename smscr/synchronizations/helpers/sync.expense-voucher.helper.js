const ExpenseVoucher = require("../../expense-voucher/expense-voucher.schema");
const SignatureParam = require("../../system-parameters/signature-param");
const activityLogServ = require("../../activity-logs/activity-log.service.js");
const { createExpenseVoucherEntriesHelper, updateExpenseVoucherEntriesHelper, deleteExpenseVoucherEntriesHelper } = require("./sync.expense-voucher-entry.helper");
const ExpenseVoucherEntry = require("../../expense-voucher/entries/expense-voucher-entries.schema");

exports.createExpenseVoucherHelper = async (expenses, author, session) => {
  await Promise.all(
    expenses.map(async data => {
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
      }).save({ session });

      if (!newExpenseVoucher) {
        throw new CustomError("Failed to sync expense vouchers", 500);
      }

      await activityLogServ.create({
        author: author._id,
        username: author.username,
        activity: `created an expense voucher`,
        resource: `expense voucher`,
        dataId: newExpenseVoucher._id,
      });

      const entriesToCreate = data.entries.filter(entry => entry.action === "create");
      const entriesToUpdate = data.entries.filter(entry => entry.action === "update");
      const entriesToDelete = data.entries.filter(entry => entry.action === "delete");

      if (entriesToCreate.length > 0) await createExpenseVoucherEntriesHelper(newExpenseVoucher, entriesToCreate, author, session);
      if (entriesToUpdate.length > 0) await updateExpenseVoucherEntriesHelper(newExpenseVoucher, entriesToUpdate, author, session);
      if (entriesToDelete.length > 0) await deleteExpenseVoucherEntriesHelper(newExpenseVoucher, entriesToDelete, author, session);
    })
  );
};

exports.updateExpenseVoucherHelper = async (expenses, author, session) => {
  await Promise.all(
    expenses.map(async data => {
      const filter = { deletedAt: null, _id: data._id };
      const updates = {
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
      };
      const options = { session };

      const updated = await ExpenseVoucher.findOneAndUpdate(filter, updates, options).lean().exec();
      if (!updated) {
        throw new CustomError("Failed to sync the expense voucher", 500);
      }

      await activityLogServ.create({
        author: author._id,
        username: author.username,
        activity: `updated a expense voucher along with its entries`,
        resource: `expense voucher`,
        dataId: updated._id,
        session,
      });

      const entriesToCreate = data.entries.filter(entry => entry.action === "create");
      const entriesToUpdate = data.entries.filter(entry => entry.action === "update");
      const entriesToDelete = data.entries.filter(entry => entry.action === "delete");

      if (entriesToCreate.length > 0) await createExpenseVoucherEntriesHelper(updated, entriesToCreate, author, session);
      if (entriesToUpdate.length > 0) await updateExpenseVoucherEntriesHelper(updated, entriesToUpdate, author, session);
      if (entriesToDelete.length > 0) await deleteExpenseVoucherEntriesHelper(updated, entriesToDelete, author, session);
    })
  );
};

exports.deleteExpenseVoucherHelper = async (expenses, author, session) => {
  const ids = expenses.map(e => e._id);
  const filter = { _id: { $in: ids }, deletedAt: null };

  const deleted = await ExpenseVoucher.updateMany(filter, { $set: { deletedAt: new Date().toISOString() } }, { session }).exec();
  if (deleted.matchedCount !== expenses.length) {
    throw new CustomError("Failed to sync the journal vouchers", 500);
  }
  await ExpenseVoucherEntry.updateMany({ journalVoucher: { $in: ids } }, { $set: { deletedAt: new Date().toISOString() } }, { session }).exec();

  await activityLogServ.bulk_create({
    ids,
    author: author._id,
    username: author.username,
    activity: `deleted a expense voucher along with its entries`,
    resource: `expense voucher`,
    session,
  });
};
