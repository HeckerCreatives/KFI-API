const CustomError = require("../../../utils/custom-error.js");
const activityLogServ = require("../../activity-logs/activity-log.service.js");
const JournalVoucherEntry = require("../../journal-voucher/entries/journal-voucher-entries.schema.js");

exports.createJournalVoucherEntriesHelper = async (journalVoucher, journalVoucherEntries, author, session) => {
  const entries = journalVoucherEntries.map(entry => ({
    line: entry.line,
    journalVoucher: journalVoucher._id,
    client: entry.client || null,
    particular: entry.particular || null,
    acctCode: entry.acctCodeId,
    debit: entry.debit,
    credit: entry.credit,
    cvForRecompute: entry.cvForRecompute,
    encodedBy: author._id,
  }));

  const addedEntries = await JournalVoucherEntry.insertMany(entries, { session });
  if (addedEntries.length !== entries.length) {
    throw new CustomError("Failed to save journal voucher");
  }

  const ids = addedEntries.map(entry => entry._id);
  await activityLogServ.bulk_create({
    ids,
    author: author._id,
    username: author.username,
    activity: `created a journal voucher entry`,
    resource: `journal voucher - entry`,
    session,
  });
};

exports.updateJournalVoucherEntriesHelper = async (journalVoucher, journalVoucherEntries, author, session) => {
  const setters = journalVoucherEntries.map(entry => ({
    updateOne: {
      filter: { _id: entry._id, journalVoucher: journalVoucher._id },
      update: {
        $set: {
          line: entry.line,
          client: entry.client || null,
          particular: entry.particular || null,
          acctCode: entry.acctCodeId,
          debit: entry.debit,
          credit: entry.credit,
          cvForRecompute: entry.cvForRecompute,
        },
      },
    },
  }));

  const updates = await JournalVoucherEntry.bulkWrite(setters, { session });

  if (updates.modifiedCount + updates.upsertedCount !== journalVoucherEntries.length) {
    throw new CustomError("Failed to sync journal vouchers. Please try again.", 500);
  }

  const ids = journalVoucherEntries.map(e => e._id);
  await activityLogServ.bulk_create({
    ids,
    author: author._id,
    username: author.username,
    activity: `updated a journal voucher - entry`,
    resource: `journal voucher - entry`,
    session,
  });
};

exports.deleteJournalVoucherEntriesHelper = async (journalVoucher, journalVoucherEntries, author, session) => {
  const ids = journalVoucherEntries.map(e => e._id);
  const deleted = await JournalVoucherEntry.updateMany(
    { _id: { $in: ids }, journalVoucher: journalVoucher._id },
    { $set: { deletedAt: new Date().toISOString() } },
    { session }
  ).exec();

  if (deleted.matchedCount !== ids.length) {
    throw new CustomError("Failed to sync journal voucher entries. Please try again", 500);
  }

  await activityLogServ.bulk_create({
    ids,
    author: author._id,
    username: author.username,
    activity: `deleted a journal voucher - entry`,
    resource: `journal voucher - entry`,
    session,
  });
};
