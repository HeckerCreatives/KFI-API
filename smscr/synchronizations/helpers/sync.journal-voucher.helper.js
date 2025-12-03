const CustomError = require("../../../utils/custom-error.js");
const JournalVoucher = require("../../journal-voucher/journal-voucher.schema.js");
const SignatureParam = require("../../system-parameters/signature-param.js");
const activityLogServ = require("../../activity-logs/activity-log.service.js");
const { createJournalVoucherEntriesHelper, updateJournalVoucherEntriesHelper, deleteJournalVoucherEntriesHelper } = require("./sync.journal-voucher-entry.helper");
const JournalVoucherEntry = require("../../journal-voucher/entries/journal-voucher-entries.schema.js");

exports.createJournalVoucherHelper = async (journals, author, session) => {
  const signature = await SignatureParam.findOne({ type: "journal voucher" }).lean().exec();
  await Promise.all(
    journals.map(async data => {
      const newJournalVoucher = await new JournalVoucher({
        code: data.code.toUpperCase(),
        nature: data.nature,
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

      if (!newJournalVoucher) {
        throw new CustomError("Failed to create a new journal voucher", 500);
      }

      await activityLogServ.create({
        author: author._id,
        username: author.username,
        activity: `created a journal voucher`,
        resource: `journal voucher`,
        dataId: newJournalVoucher._id,
        session,
      });

      const entriesToCreate = data.entries.filter(entry => entry.action === "create");
      const entriesToUpdate = data.entries.filter(entry => entry.action === "update");
      const entriesToDelete = data.entries.filter(entry => entry.action === "delete");

      if (entriesToCreate.length > 0) await createJournalVoucherEntriesHelper(newJournalVoucher, entriesToCreate, author, session);
      if (entriesToUpdate.length > 0) await updateJournalVoucherEntriesHelper(newJournalVoucher, entriesToUpdate, author, session);
      if (entriesToDelete.length > 0) await deleteJournalVoucherEntriesHelper(newJournalVoucher, entriesToDelete, author, session);
    })
  );
};

exports.updateJournalVoucherHelper = async (journals, author, session) => {
  await Promise.all(
    journals.map(async data => {
      const filter = { deletedAt: null, _id: data._id };
      const updates = {
        $set: {
          code: data.code.toUpperCase(),
          nature: data.nature,
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

      const updated = await JournalVoucher.findOneAndUpdate(filter, updates, options).lean().exec();
      if (!updated) {
        throw new CustomError("Failed to sync the journal voucher", 500);
      }

      await activityLogServ.create({
        author: author._id,
        username: author.username,
        activity: `updated a journal voucher along with its entries`,
        resource: `journal voucher`,
        dataId: updated._id,
        session,
      });

      const entriesToCreate = data.entries.filter(entry => entry.action === "create");
      const entriesToUpdate = data.entries.filter(entry => entry.action === "update");
      const entriesToDelete = data.entries.filter(entry => entry.action === "delete");

      if (entriesToCreate.length > 0) await createJournalVoucherEntriesHelper(updated, entriesToCreate, author, session);
      if (entriesToUpdate.length > 0) await updateJournalVoucherEntriesHelper(updated, entriesToUpdate, author, session);
      if (entriesToDelete.length > 0) await deleteJournalVoucherEntriesHelper(updated, entriesToDelete, author, session);
    })
  );
};

exports.deleteJournalVoucherHelper = async (journals, author, session) => {
  const ids = journals.map(e => e._id);
  const filter = { _id: { $in: ids }, deletedAt: null };

  const deleted = await JournalVoucher.updateMany(filter, { $set: { deletedAt: new Date().toISOString() } }, { session }).exec();
  if (deleted.matchedCount !== journals.length) {
    throw new CustomError("Failed to sync the journal vouchers", 500);
  }
  await JournalVoucherEntry.updateMany({ journalVoucher: { $in: ids } }, { $set: { deletedAt: new Date().toISOString() } }, { session }).exec();

  await activityLogServ.bulk_create({
    ids,
    author: author._id,
    username: author.username,
    activity: `deleted a journal voucher along with its entries`,
    resource: `journal voucher`,
    session,
  });
};
