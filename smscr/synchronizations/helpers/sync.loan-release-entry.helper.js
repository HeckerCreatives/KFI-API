const Entry = require("../../transactions/entries/entry.schema.js");
const activityLogServ = require("../../activity-logs/activity-log.service.js");
const CustomError = require("../../../utils/custom-error.js");

exports.createLoanReleaseEntriesHelper = async (loanRelease, loanReleaseEntries, author, session) => {
  const entries = loanReleaseEntries.map((entry, i) => ({
    line: entry.line,
    transaction: loanRelease._id,
    client: entry?.client || null,
    center: loanRelease.center,
    product: loanRelease.loan,
    acctCode: entry.acctCodeId,
    particular: entry.particular,
    debit: entry.debit,
    credit: entry.credit,
    interest: entry.interest,
    cycle: entry.cycle,
    checkNo: entry.checkNo,
    encodedBy: author._id,
  }));

  const addedEntries = await Entry.insertMany(entries, { session });

  if (addedEntries.length !== entries.length) {
    throw new CustomError("Failed to save loan release");
  }

  const ids = addedEntries.map(entry => entry._id);

  await activityLogServ.bulk_create({
    ids,
    author: author._id,
    username: author.username,
    activity: `created a loan release entry`,
    resource: `loan release - entry`,
    session,
  });
};

exports.updateLoanReleaseEntriesHelper = async (loanRelease, loanReleaseEntries, author, session) => {
  const setters = loanReleaseEntries.map(entry => ({
    updateOne: {
      filter: { _id: entry._id, transaction: loanRelease._id },
      update: {
        $set: {
          line: entry.line,
          client: entry?.client || null,
          acctCode: entry.acctCodeId,
          particular: entry.particular,
          debit: entry.debit,
          credit: entry.credit,
          interest: entry.interest,
          cycle: entry.cycle,
          checkNo: entry.checkNo,
        },
      },
    },
  }));

  const updates = await Entry.bulkWrite(setters, { session });

  if (updates.modifiedCount + updates.upsertedCount !== loanReleaseEntries.length) {
    throw new CustomError("Failed to sync loan releases. Please try again.", 500);
  }

  const ids = loanReleaseEntries.map(e => e._id);
  await activityLogServ.bulk_create({
    ids,
    author: author._id,
    username: author.username,
    activity: `updated a loan release - entry`,
    resource: `loan release - entry`,
    session,
  });
};

exports.deleteLoanReleaseEntriesHelper = async (loanRelease, loanReleaseEntries, author, session) => {
  const ids = loanReleaseEntries.map(e => e._id);
  const deleted = await Entry.updateMany({ _id: { $in: ids }, transaction: loanRelease._id }, { $set: { deletedAt: new Date().toISOString() } }, { session }).exec();

  if (deleted.matchedCount !== ids.length) {
    throw new CustomError("Failed to sync loan release entries. Please try again", 500);
  }

  await activityLogServ.bulk_create({
    ids,
    author: author._id,
    username: author.username,
    activity: `deleted a loan release - entry`,
    resource: `loan release - entry`,
    session,
  });
};
