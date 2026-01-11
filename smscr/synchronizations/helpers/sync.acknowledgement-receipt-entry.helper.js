const CustomError = require("../../../utils/custom-error");
const ReleaseEntry = require("../../release/entries/release-entries.schema");
const activityLogServ = require("../../activity-logs/activity-log.service.js");
const { loanTypeValues } = require("../../../constants/loan-types.js");

exports.createAcknowledgementReceiptEntriesHelper = async (acknowledgementReceipt, acknowledgementReceiptEntries, author, session) => {
  const entries = acknowledgementReceiptEntries.map(entry => ({
    line: entry.line,
    release: acknowledgementReceipt._id,
    client: entry.clientId || null,
    loanReleaseId: entry.loanReleaseId || null,
    dueDate: entry.dueDate,
    acctCode: entry.acctCodeId,
    particular: entry.particular,
    debit: entry.debit,
    credit: entry.credit,
    week: entry?.week,
    encodedBy: author._id,
    type: loanTypeValues[entry.type],
  }));

  const addedEntries = await ReleaseEntry.insertMany(entries, { session });

  if (addedEntries.length !== entries.length) {
    throw new CustomError("Failed to sync acknowledgement receipts");
  }

  const ids = addedEntries.map(entry => entry._id);
  await activityLogServ.bulk_create({
    ids,
    author: author._id,
    username: author.username,
    activity: `created a acknowledgement receipts entry`,
    resource: `acknowledgement receipts - entry`,
    session,
  });
};

exports.updateAcknowledgementReceiptEntriesHelper = async (acknowledgementReceipt, acknowledgementReceiptEntries, author, session) => {
  const setters = acknowledgementReceiptEntries.map(entry => ({
    updateOne: {
      filter: { _id: entry._id, release: acknowledgementReceipt._id },
      update: {
        $set: {
          line: entry.line,
          client: entry.clientId || null,
          loanReleaseId: entry.loanReleaseId || null,
          dueDate: entry.dueDate,
          acctCode: entry.acctCodeId,
          particular: entry.particular,
          debit: entry.debit,
          credit: entry.credit,
          week: entry?.week,
          type: loanTypeValues[entry.type],
        },
      },
    },
  }));

  const updates = await ReleaseEntry.bulkWrite(setters, { session });

  if (updates.modifiedCount + updates.upsertedCount !== acknowledgementReceiptEntries.length) {
    throw new CustomError("Failed to sync acknowledgement receipts. Please try again.", 500);
  }

  const ids = acknowledgementReceiptEntries.map(e => e._id);
  await activityLogServ.bulk_create({
    ids,
    author: author._id,
    username: author.username,
    activity: `updated a acknowledgement receipts - entry`,
    resource: `acknowledgement receipts - entry`,
    session,
  });
};

exports.deleteAcknowledgementReceiptEntriesHelper = async (acknowledgementReceipt, acknowledgementReceiptEntries, author, session) => {
  const ids = acknowledgementReceiptEntries.map(e => e._id);
  const deleted = await ReleaseEntry.updateMany({ _id: { $in: ids }, release: acknowledgementReceipt._id }, { $set: { deletedAt: new Date().toISOString() } }, { session }).exec();

  if (deleted.matchedCount !== ids.length) {
    throw new CustomError("Failed to sync acknowledgement receipts. Please try again", 500);
  }

  await activityLogServ.bulk_create({
    ids,
    author: author._id,
    username: author.username,
    activity: `deleted a acknowledgement receipts - entry`,
    resource: `acknowledgement receipts - entry`,
    session,
  });
};
