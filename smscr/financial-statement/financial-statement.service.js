const { default: mongoose } = require("mongoose");
const FinancialStatement = require("./financial-statement.schema.js");
const CustomError = require("../../utils/custom-error.js");
const FinancialStatementEntry = require("./financial-statement-entry.schema");
const activityLogServ = require("../activity-logs/activity-log.service.js");

exports.get_all_paginated = async (limit, page, offset, keyword) => {
  const filter = { deletedAt: null };
  if (keyword) filter.$or = [{ reportCode: new RegExp(keyword, "i") }, { reportName: new RegExp(keyword, "i") }];

  const countPromise = FinancialStatement.countDocuments(filter);
  const financialStatementPromise = FinancialStatement.find(filter).skip(offset).limit(limit).exec();

  const [count, financialStatements] = await Promise.all([countPromise, financialStatementPromise]);

  const hasNextPage = count > offset + limit;
  const hasPrevPage = page > 1;
  const totalPages = Math.ceil(count / limit);

  return {
    success: true,
    financialStatements,
    hasNextPage,
    hasPrevPage,
    totalPages,
  };
};

exports.create = async (data, author) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const financialStatement = await new FinancialStatement({
      reportCode: data.reportCode,
      reportName: data.reportName,
      type: data.type,
      "primary.year": data.primaryYear,
      "primary.month": data.primaryMonth,
      "secondary.year": data.secondaryYear,
      "secondary.month": data.secondaryMonth,
      title: "",
      subTitle: "",
    }).save({ session });

    if (!financialStatement) throw new CustomError("Failed to create a financial statement", 500);

    await activityLogServ.create({
      author: author._id,
      username: author.username,
      activity: `created a  financial statement`,
      resource: `financial statement`,
      dataId: financialStatement._id,
      session,
    });

    await session.commitTransaction();

    return { success: true, financialStatement };
  } catch (error) {
    await session.abortTransaction();
    throw new CustomError(error.message || "Failed to create a financial statement", error.statusCode || 500);
  } finally {
    await session.endSession();
  }
};

exports.update = async (id, data, author) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const filter = { _id: id, deletedAt: null };
    const updates = {
      reportCode: data.reportCode,
      reportName: data.reportName,
      type: data.type,
      "primary.year": data.primaryYear,
      "primary.month": data.primaryMonth,
      "secondary.year": data.secondaryYear,
      "secondary.month": data.secondaryMonth,
    };
    const options = { session, new: true };

    const financialStatement = await FinancialStatement.findOneAndUpdate(filter, updates, options).exec();
    if (!financialStatement) throw new CustomError("Failed to update financial statement", 500);

    await activityLogServ.create({
      author: author._id,
      username: author.username,
      activity: `updated a  financial statement`,
      resource: `financial statement`,
      dataId: financialStatement._id,
      session,
    });

    await session.commitTransaction();

    return { success: true, financialStatement };
  } catch (error) {
    await session.abortTransaction();
    throw new CustomError(error.message || "Failed to update financial statement", error.statusCode || 500);
  } finally {
    await session.endSession();
  }
};

exports.delete = async (id, author) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const filter = { _id: id, deletedAt: null };
    const deletedFinancialStatement = await FinancialStatement.updateOne(filter, { $set: { deletedAt: new Date().toISOString() } }, { session }).exec();
    if (!deletedFinancialStatement.acknowledged || deletedFinancialStatement.modifiedCount < 1) {
      throw new CustomError("Failed to delete the financial statement", 500);
    }
    await FinancialStatementEntry.updateMany({ financialStatement: id }, { $set: { deletedAt: new Date().toISOString() } }, { session }).exec();

    await activityLogServ.create({
      author: author._id,
      username: author.username,
      activity: `deleted a financial statement and its entries`,
      resource: `financial statement`,
      dataId: filter._id,
      session,
    });

    await session.commitTransaction();

    return { success: true, financialStatement: filter._id };
  } catch (error) {
    await session.abortTransaction();
    throw new CustomError(error.message || "Failed to delete financial statement", error.statusCode || 500);
  } finally {
    await session.abortTransaction();
  }
};

exports.get_all_entries_not_paginated = async id => {
  const financialStatementPromise = FinancialStatement.findById(id).select("title subTitle").lean().exec();
  const financialStatementEntriesPromise = FinancialStatementEntry.find({ financialStatement: id, deletedAt: null }).sort({ line: 1 }).lean().exec();
  const [financialStatement, financialStatementEntries] = await Promise.all([financialStatementPromise, financialStatementEntriesPromise]);
  return { success: true, financialStatement, financialStatementEntries };
};

exports.create_entries = async (id, data, author) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const financialStatementUpdate = await FinancialStatement.findByIdAndUpdate(id, { title: data.title, subTitle: data.subTitle }, { session }).lean().exec();
    if (!financialStatementUpdate) throw new CustomError("Failed to create financial statement entries", 500);

    const entries = data.entries.map(entry => ({
      financialStatement: financialStatementUpdate._id,
      line: entry.line,
      acctCode: entry.acctCode,
      remarks: entry.remarks,
      amountType: entry.amountType,
    }));

    const savedEntries = await FinancialStatementEntry.insertMany(entries, { session });
    if (savedEntries.length !== entries.length) throw new CustomError("Failed to create financial statement entries", 500);

    await activityLogServ.create({
      author: author._id,
      username: author.username,
      activity: `updated a financial statement title/sub title`,
      resource: `financial statement`,
      dataId: financialStatementUpdate._id,
      session,
    });

    const entryIds = savedEntries.map(entry => entry._id);
    await activityLogServ.bulk_create({
      ids: entryIds,
      author: author._id,
      username: author.username,
      activity: `created a financial statement entry`,
      resource: `financial statement - entry`,
      session,
    });

    await session.commitTransaction();

    return { success: true, financialStatementUpdate };
  } catch (error) {
    await session.abortTransaction();
    throw new CustomError(error.message || "Failed to create financial statement entries", error.statusCode || 500);
  } finally {
    await session.endSession();
  }
};

exports.update_entries = async (id, data, author) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const filter = { _id: id, deletedAt: null };
    const updates = { title: data.title, subTitle: data.subTitle };
    const options = { session, new: true };

    const financialStatementUpdate = await FinancialStatement.findOneAndUpdate(filter, updates, options).exec();
    if (!financialStatementUpdate) throw new CustomError("Failed to update financial statement entries", 500);

    const toCreate = data.entries.filter(e => !e._id);
    const toUpdate = data.entries.filter(e => e._id);
    const updatedIds = [];

    if (toCreate.length > 0) {
      const entries = toCreate.map(entry => ({
        financialStatement: financialStatementUpdate._id,
        line: entry.line,
        acctCode: entry.acctCode,
        remarks: entry.remarks,
        amountType: entry.amountType,
      }));

      const savedEntries = await FinancialStatementEntry.insertMany(entries, { session });
      if (savedEntries.length !== entries.length) throw new CustomError("Failed to update financial statement entries", 500);

      savedEntries.map(entry => updatedIds.push(`${entry._id}`));
      const entryIds = savedEntries.map(entry => entry._id);
      await activityLogServ.bulk_create({
        ids: entryIds,
        author: author._id,
        username: author.username,
        activity: `created a financial statement entry`,
        resource: `financial statement - entry`,
        session,
      });
    }

    if (toUpdate.length > 0) {
      const updates = toUpdate.map(entry => ({
        updateOne: {
          filter: { _id: entry._id, deletedAt: null, financialStatement: financialStatementUpdate._id },
          update: {
            $set: {
              line: entry.line,
              acctCode: entry.acctCode,
              remarks: entry.remarks,
              amountType: entry.amountType,
            },
          },
        },
      }));

      const updateds = await FinancialStatementEntry.bulkWrite(updates, { session });
      if (updateds.matchedCount !== updates.length) {
        throw new CustomError("Failed to update the financial statement entries", 500);
      }
      toUpdate.map(entry => updatedIds.push(entry._id));
      const entryIds = toUpdate.map(entry => entry._id);
      await activityLogServ.bulk_create({
        ids: entryIds,
        author: author._id,
        username: author.username,
        activity: `updated a financial statement entry`,
        resource: `financial statement - entry`,
        session,
      });
    }

    if (data.deletedIds && data.deletedIds.length > 0) {
      const deleted = await FinancialStatementEntry.updateMany(
        { _id: { $in: data.deletedIds }, deletedAt: { $exists: false } },
        { deletedAt: new Date().toISOString() },
        { session }
      ).exec();
      if (deleted.matchedCount !== data.deletedIds.length) {
        throw new CustomError("Failed to update the financial statement entries", 500);
      }
      await activityLogServ.bulk_create({
        ids: data.deletedIds,
        author: author._id,
        username: author.username,
        activity: `deleted a financial statement entry`,
        resource: `financial statement - entry`,
        session,
      });
    }

    await activityLogServ.create({
      author: author._id,
      username: author.username,
      activity: `updated a financial statement title/sub title`,
      resource: `financial statement`,
      dataId: financialStatementUpdate._id,
      session,
    });

    await session.commitTransaction();

    return { success: true, financialStatement: financialStatementUpdate };
  } catch (error) {
    await session.abortTransaction();
    throw new CustomError(error.message || "Failed to update financial statement entries", error.statusCode || 500);
  } finally {
    await session.endSession();
  }
};
