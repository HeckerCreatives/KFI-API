const CustomError = require("../../../utils/custom-error");
const AcknowledgementEntry = require("../../acknowledgement/entries/acknowledgement-entries.schema");
const activityLogServ = require("../../activity-logs/activity-log.service.js");

exports.createOfficialReceiptEntriesHelper = async (officialReceipt, officialReceiptEntries, author, session) => {
  const entries = officialReceiptEntries.map(entry => ({
    line: entry.line,
    acknowledgement: officialReceipt._id,
    loanReleaseId: entry.loanReleaseId || null,
    client: entry?.clientId || null,
    week: entry?.week,
    dueDate: entry.dueDate,
    acctCode: entry.acctCodeId,
    particular: entry.particular,
    debit: entry.debit,
    credit: entry.credit,
    encodedBy: author._id,
  }));

  const addedEntries = await AcknowledgementEntry.insertMany(entries, { session });
  if (addedEntries.length !== entries.length) {
    throw new CustomError("Failed to save official receipts");
  }

  const ids = addedEntries.map(entry => entry._id);
  await activityLogServ.bulk_create({
    ids,
    author: author._id,
    username: author.username,
    activity: `created a official receipt entry`,
    resource: `official receipt - entry`,
    session,
  });
};

exports.updateOfficialReceiptEntriesHelper = async (officialReceipt, officialReceiptEntries, author, session) => {
  const setters = officialReceiptEntries.map(entry => ({
    updateOne: {
      filter: { _id: entry._id, acknowledgement: officialReceipt._id },
      update: {
        $set: {
          line: entry.line,
          loanReleaseId: entry.loanReleaseId || null,
          client: entry?.clientId || null,
          week: entry?.week,
          dueDate: entry.dueDate,
          acctCode: entry.acctCodeId,
          particular: entry.particular,
          debit: entry.debit,
          credit: entry.credit,
        },
      },
    },
  }));

  const updates = await AcknowledgementEntry.bulkWrite(setters, { session });

  if (updates.modifiedCount + updates.upsertedCount !== officialReceiptEntries.length) {
    throw new CustomError("Failed to sync official receipts. Please try again.", 500);
  }

  const ids = officialReceiptEntries.map(e => e._id);
  await activityLogServ.bulk_create({
    ids,
    author: author._id,
    username: author.username,
    activity: `updated a official receipt - entry`,
    resource: `official receipt - entry`,
    session,
  });
};

exports.deleteOfficialReceiptEntriesHelper = async (officialReceipt, officialReceiptEntries, author, session) => {
  const ids = officialReceiptEntries.map(e => e._id);
  const deleted = await AcknowledgementEntry.updateMany(
    { _id: { $in: ids }, acknowledgement: officialReceipt._id },
    { $set: { deletedAt: new Date().toISOString() } },
    { session }
  ).exec();

  if (deleted.matchedCount !== ids.length) {
    throw new CustomError("Failed to sync official receipt entries. Please try again", 500);
  }

  await activityLogServ.bulk_create({
    ids,
    author: author._id,
    username: author.username,
    activity: `deleted a official receipt - entry`,
    resource: `official receipt - entry`,
    session,
  });
};
