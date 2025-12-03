const CustomError = require("../../../utils/custom-error.js");
const activityLogServ = require("../../activity-logs/activity-log.service.js");
const DamayanFundEntry = require("../../damayan-fund/entries/damayan-fund-entries.schema.js");

exports.createDamayanFundEntriesHelper = async (damayanFund, damayanFundEntries, author, session) => {
  const entries = damayanFundEntries.map(entry => ({
    line: entry.line,
    damayanFund: damayanFund._id,
    client: entry.client || null,
    particular: entry.particular || null,
    acctCode: entry.acctCodeId,
    debit: entry.debit,
    credit: entry.credit,
  }));

  const newEntries = await DamayanFundEntry.insertMany(entries, { session });

  if (newEntries.length !== entries.length) {
    throw new CustomError("Failed to create an damayan fund");
  }

  const ids = newEntries.map(entry => entry._id);
  await activityLogServ.bulk_create({
    ids,
    author: author._id,
    username: author.username,
    activity: `created a damayan fund entry`,
    resource: `damayan fund - entry`,
    session,
  });
};

exports.updateDamayanFundEntriesHelper = async (damayanFund, damayanFundEntries, author, session) => {
  const setters = damayanFundEntries.map(entry => ({
    updateOne: {
      filter: { _id: entry._id, damayanFund: damayanFund._id },
      update: {
        $set: {
          line: entry.line,
          damayanFund: damayanFund._id,
          client: entry.client || null,
          particular: entry.particular || null,
          acctCode: entry.acctCodeId,
          debit: entry.debit,
          credit: entry.credit,
        },
      },
    },
  }));

  const updates = await DamayanFundEntry.bulkWrite(setters, { session });

  if (updates.modifiedCount + updates.upsertedCount !== damayanFundEntries.length) {
    throw new CustomError("Failed to sync damayan funds. Please try again.", 500);
  }

  const ids = damayanFundEntries.map(e => e._id);
  await activityLogServ.bulk_create({
    ids,
    author: author._id,
    username: author.username,
    activity: `updated a damayan fund - entry`,
    resource: `damayan fund - entry`,
    session,
  });
};

exports.deleteDamayanFundEntriesHelper = async (damayanFund, damayanFundEntries, author, session) => {
  const ids = damayanFundEntries.map(e => e._id);
  const deleted = await DamayanFundEntry.updateMany({ _id: { $in: ids }, damayanFund: damayanFund._id }, { $set: { deletedAt: new Date().toISOString() } }, { session }).exec();

  if (deleted.matchedCount !== ids.length) {
    throw new CustomError("Failed to sync damayan fund entries. Please try again", 500);
  }

  await activityLogServ.bulk_create({
    ids,
    author: author._id,
    username: author.username,
    activity: `deleted a damayan fund - entry`,
    resource: `damayan fund - entry`,
    session,
  });
};
