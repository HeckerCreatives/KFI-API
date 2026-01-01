const TrialBalance = require("./trial-balance.schema.js");
const TrialBalanceEntry = require("./trial-balance-entry.schema.js");
const mongoose = require("mongoose");
const activityLogServ = require("../activity-logs/activity-log.service.js");
const CustomError = require("../../utils/custom-error.js");

exports.get_all_paginated = async (limit, page, offset, keyword) => {
  const filter = { deletedAt: null };
  if (keyword) filter.$or = [{ reportCode: new RegExp(keyword, "i") }, { reportName: new RegExp(keyword, "i") }];

  const countPromise = TrialBalance.countDocuments(filter);
  const trialBalancePromise = TrialBalance.find(filter).skip(offset).limit(limit).exec();

  const [count, trialBalances] = await Promise.all([countPromise, trialBalancePromise]);

  const hasNextPage = count > offset + limit;
  const hasPrevPage = page > 1;
  const totalPages = Math.ceil(count / limit);

  return {
    success: true,
    trialBalances,
    hasNextPage,
    hasPrevPage,
    totalPages,
  };
};

exports.create = async (data, author) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const trialBalance = await new TrialBalance({
      reportCode: data.reportCode,
      reportName: data.reportName,
    }).save({ session });

    if (!trialBalance) throw new CustomError("Failed to create a trial balance", 500);

    await activityLogServ.create({
      author: author._id,
      username: author.username,
      activity: `created a trial balance`,
      resource: `trial balance`,
      dataId: trialBalance._id,
      session,
    });

    await session.commitTransaction();

    return { success: true, trialBalance };
  } catch (error) {
    await session.abortTransaction();
    throw new CustomError(error.message || "Failed to create trial balance", error.statusCode || 500);
  } finally {
    await session.endSession();
  }
};

exports.update = async (id, data, author) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const filter = { _id: id, deletedAt: null };
    const updates = { reportCode: data.reportCode, reportName: data.reportName };
    const options = { session, new: true };

    const trialBalance = await TrialBalance.findOneAndUpdate(filter, updates, options).exec();
    if (!trialBalance) throw new CustomError("Failed to update trial balance", 500);

    await activityLogServ.create({
      author: author._id,
      username: author.username,
      activity: `updated a trial balance`,
      resource: `trial balance`,
      dataId: trialBalance._id,
      session,
    });

    await session.commitTransaction();

    return { success: true, trialBalance };
  } catch (error) {
    await session.abortTransaction();
    throw new CustomError(error.message || "Failed to update trial balance", error.statusCode || 500);
  } finally {
    await session.endSession();
  }
};

exports.delete = async (id, author) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const filter = { _id: id, deletedAt: null };
    const deleted = await TrialBalance.updateOne(filter, { $set: { deletedAt: new Date().toISOString() } }, { session }).exec();
    if (!deleted.acknowledged || deleted.modifiedCount < 1) {
      throw new CustomError("Failed to delete the trial balance", 500);
    }
    await TrialBalanceEntry.updateMany({ trialBalance: id }, { $set: { deletedAt: new Date().toISOString() } }, { session }).exec();

    await activityLogServ.create({
      author: author._id,
      username: author.username,
      activity: `deleted a trial balance and its entries`,
      resource: `trial balance`,
      dataId: filter._id,
      session,
    });

    await session.commitTransaction();

    return { success: true, trialBalance: filter._id };
  } catch (error) {
    console.log(error);
    await session.abortTransaction();
    throw new CustomError(error.message || "Failed to delete trial balance", error.statusCode || 500);
  } finally {
    await session.endSession();
  }
};

// TRIAL BALANCE ENTRIES

exports.get_all_entries_not_paginated = async id => {
  const trialBalanceEntries = await TrialBalanceEntry.find({ trialBalance: id, deletedAt: null }).sort({ line: 1 }).lean().exec();
  return { success: true, trialBalanceEntries };
};

exports.create_entries = async (id, data, author) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const trialBalance = await TrialBalance.findById(id).session(session).lean().exec();
    if (!trialBalance) throw new CustomError("Failed to create trial balance entries", 500);

    const entries = data.entries.map(entry => ({
      trialBalance: trialBalance._id,
      line: entry.line,
      acctCode: entry.acctCode,
      remarks: entry.remarks,
    }));

    const savedEntries = await TrialBalanceEntry.insertMany(entries, { session });
    if (savedEntries.length !== entries.length) throw new CustomError("Failed to create trial balance entries", 500);

    const entryIds = savedEntries.map(entry => entry._id);
    await activityLogServ.bulk_create({
      ids: entryIds,
      author: author._id,
      username: author.username,
      activity: `created a trial balance entry`,
      resource: `trial balance - entry`,
      session,
    });

    await session.commitTransaction();

    return { success: true, trialBalance };
  } catch (error) {
    await session.abortTransaction();
    throw new CustomError(error.message || "Failed to create trial balance entries", error.statusCode || 500);
  } finally {
    await session.endSession();
  }
};

exports.update_entries = async (id, data, author) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const trialBalance = await TrialBalance.findById(id).session(session).lean().exec();
    if (!trialBalance) throw new CustomError("Failed to update trial balance entries", 500);

    const toCreate = data.entries.filter(e => !e._id);
    const toUpdate = data.entries.filter(e => e._id);
    const updatedIds = [];

    if (toCreate.length > 0) {
      const entries = toCreate.map(entry => ({
        trialBalance: trialBalance._id,
        line: entry.line,
        acctCode: entry.acctCode,
        remarks: entry.remarks,
      }));

      const savedEntries = await TrialBalanceEntry.insertMany(entries, { session });
      if (savedEntries.length !== entries.length) throw new CustomError("Failed to update trial balance entries", 500);

      savedEntries.map(entry => updatedIds.push(`${entry._id}`));
      const entryIds = savedEntries.map(entry => entry._id);
      await activityLogServ.bulk_create({
        ids: entryIds,
        author: author._id,
        username: author.username,
        activity: `created a trial balance entry`,
        resource: `trial balance - entry`,
        session,
      });
    }

    if (toUpdate.length > 0) {
      const updates = toUpdate.map(entry => ({
        updateOne: {
          filter: { _id: entry._id, deletedAt: null, trialBalance: trialBalance._id },
          update: { $set: { line: entry.line, acctCode: entry.acctCode, remarks: entry.remarks } },
        },
      }));

      const updateds = await TrialBalanceEntry.bulkWrite(updates, { session });
      if (updateds.matchedCount !== updates.length) {
        throw new CustomError("Failed to update the trial balance entries", 500);
      }
      toUpdate.map(entry => updatedIds.push(entry._id));
      const entryIds = toUpdate.map(entry => entry._id);
      await activityLogServ.bulk_create({
        ids: entryIds,
        author: author._id,
        username: author.username,
        activity: `updated a trial balance entry`,
        resource: `trial balance - entry`,
        session,
      });
    }

    if (data.deletedIds && data.deletedIds.length > 0) {
      const deleted = await TrialBalanceEntry.updateMany(
        { _id: { $in: data.deletedIds }, deletedAt: { $exists: false } },
        { deletedAt: new Date().toISOString() },
        { session }
      ).exec();
      if (deleted.matchedCount !== data.deletedIds.length) {
        throw new CustomError("Failed to update the trial balance entries", 500);
      }
      await activityLogServ.bulk_create({
        ids: data.deletedIds,
        author: author._id,
        username: author.username,
        activity: `deleted a trial balance entry`,
        resource: `trial balance - entry`,
        session,
      });
    }

    await session.commitTransaction();

    return { success: true, trialBalance };
  } catch (error) {
    await session.abortTransaction();
    throw new CustomError(error.message || "Failed to update trial balance entries", error.statusCode || 500);
  } finally {
    await session.endSession();
  }
};
