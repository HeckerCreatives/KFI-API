const CustomError = require("../../../utils/custom-error.js");
const activityLogServ = require("../../activity-logs/activity-log.service.js");
const EmergencyLoanEntry = require("../../emergency-loan/entries/emergency-loan-entry.schema.js");

exports.createEmergencyLoanEntriesHelper = async (emergencyLoan, emergencyLoanEntries, author, session) => {
  const entries = emergencyLoanEntries.map(entry => ({
    line: entry.line,
    emergencyLoan: emergencyLoan._id,
    client: entry.client || null,
    particular: entry.particular || null,
    acctCode: entry.acctCodeId,
    debit: entry.debit,
    credit: entry.credit,
  }));

  const newEntries = await EmergencyLoanEntry.insertMany(entries, { session });

  if (newEntries.length !== emergencyLoanEntries.length) {
    throw new CustomError("Failed to create an emergency loan");
  }

  const ids = newEntries.map(entry => entry._id);
  await activityLogServ.bulk_create({
    ids,
    author: author._id,
    username: author.username,
    activity: `created a emergency loan entry`,
    resource: `emergency loan - entry`,
    session,
  });
};

exports.updateEmergencyLoanEntriesHelper = async (emergencyLoan, emergencyLoanEntries, author, session) => {
  const setters = emergencyLoanEntries.map(entry => ({
    updateOne: {
      filter: { _id: entry._id, emergencyLoan: emergencyLoan._id },
      update: {
        $set: {
          line: entry.line,
          client: entry.client || null,
          particular: entry.particular || null,
          acctCode: entry.acctCodeId,
          debit: entry.debit,
          credit: entry.credit,
        },
      },
    },
  }));

  const updates = await EmergencyLoanEntry.bulkWrite(setters, { session });

  if (updates.modifiedCount + updates.upsertedCount !== emergencyLoanEntries.length) {
    throw new CustomError("Failed to sync emergency loans. Please try again.", 500);
  }

  const ids = emergencyLoanEntries.map(e => e._id);
  await activityLogServ.bulk_create({
    ids,
    author: author._id,
    username: author.username,
    activity: `updated a emergency loan - entry`,
    resource: `emergency loan - entry`,
    session,
  });
};

exports.deleteEmergencyLoanEntriesHelper = async (emergencyLoan, emergencyLoanEntries, author, session) => {
  const ids = emergencyLoanEntries.map(e => e._id);
  const deleted = await EmergencyLoanEntry.updateMany(
    { _id: { $in: ids }, emergencyLoan: emergencyLoan._id },
    { $set: { deletedAt: new Date().toISOString() } },
    { session }
  ).exec();

  if (deleted.matchedCount !== ids.length) {
    throw new CustomError("Failed to sync emergency loan entries. Please try again", 500);
  }

  await activityLogServ.bulk_create({
    ids,
    author: author._id,
    username: author.username,
    activity: `deleted a emergency loan - entry`,
    resource: `emergency loan - entry`,
    session,
  });
};
