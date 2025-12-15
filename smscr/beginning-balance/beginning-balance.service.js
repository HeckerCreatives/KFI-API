const BeginningBalance = require("./beginning-balance.schema.js");
const BeginningBalanceEntry = require("./beginning-balance-entries.schema.js");
const { default: mongoose } = require("mongoose");
const CustomError = require("../../utils/custom-error.js");
const activityLogServ = require("../activity-logs/activity-log.service.js");
const ChartOfAccount = require("../chart-of-account/chart-of-account.schema.js");

exports.get_all_paginated = async (keyword, limit, page, offset) => {
  const filter = { deletedAt: null };
  if (keyword) filter.year = keyword;

  const beginningBalancesPromise = BeginningBalance.find(filter).skip(offset).limit(limit).lean().exec();
  const countPromise = BeginningBalance.countDocuments(filter);

  const [count, beginningBalances] = await Promise.all([countPromise, beginningBalancesPromise]);

  const hasNextPage = count > offset + limit;
  const hasPrevPage = page > 1;
  const totalPages = Math.ceil(count / limit);

  return {
    success: true,
    beginningBalances,
    hasNextPage,
    hasPrevPage,
    totalPages,
  };
};

exports.get_all_entries_paginated = async (id, limit, page, offset) => {
  const filter = { deletedAt: null, beginningBalance: id };

  const beginningBalanceEntriesPromise = BeginningBalanceEntry.find(filter)
    .populate({
      path: "acctCode",
      select: "code description",
    })
    .skip(offset)
    .limit(limit)
    .lean()
    .exec();
  const countPromise = BeginningBalanceEntry.countDocuments(filter);

  const [count, beginningBalanceEntries] = await Promise.all([countPromise, beginningBalanceEntriesPromise]);

  const hasNextPage = count > offset + limit;
  const hasPrevPage = page > 1;
  const totalPages = Math.ceil(count / limit);

  return {
    success: true,
    beginningBalanceEntries,
    hasNextPage,
    hasPrevPage,
    totalPages,
  };
};

exports.create = async (data, author) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const beginningBalance = await new BeginningBalance({
      year: data.year,
      memo: data?.memo || "",
      encodedBy: author._id,
    }).save({ session });
    if (!beginningBalance) throw new CustomError("Failed to create beginning balance", 500);

    const entries = data.entries.map(entry => ({
      beginningBalance: beginningBalance._id,
      line: entry.line,
      acctCode: entry.acctCodeId,
      debit: entry.debit,
      credit: entry.credit,
    }));

    const savedEntries = await BeginningBalanceEntry.insertMany(entries, { session });
    if (savedEntries.length !== entries.length) throw new CustomError("Failed to create beginning balance", 500);

    beginningBalance.debit = entries.reduce((acc, obj) => (acc += Number(obj.debit)), 0);
    beginningBalance.credit = entries.reduce((acc, obj) => (acc += Number(obj.credit)), 0);
    beginningBalance.entryCount = entries.length;
    beginningBalance.save({ session });

    await activityLogServ.create({
      author: author._id,
      username: author.username,
      activity: `created a  beginning balance`,
      resource: `beginning balance`,
      dataId: beginningBalance._id,
      session,
    });

    const entryIds = savedEntries.map(entry => entry._id);
    await activityLogServ.bulk_create({
      ids: entryIds,
      author: author._id,
      username: author.username,
      activity: `created a beginning balance entry`,
      resource: `beginning balance - entry`,
      session,
    });

    await session.commitTransaction();

    return { success: true, beginningBalance };
  } catch (error) {
    await session.abortTransaction();
    throw new CustomError(error.message || "Failed to create beginning balance", error.statusCode || 500);
  } finally {
    await session.endSession();
  }
};

exports.update = async (id, data, author) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const filter = { _id: id, deletedAt: null };
    const updates = { year: data.year, memo: data?.memo || "" };
    const options = { session, new: true };

    const beginningBalance = await BeginningBalance.findOneAndUpdate(filter, updates, options).exec();
    if (!beginningBalance) throw new CustomError("Failed to create beginning balance", 500);

    const toCreate = data.entries.filter(e => !e._id);
    const toUpdate = data.entries.filter(e => e._id);
    const updatedIds = [];

    if (toCreate.length > 0) {
      const entries = toCreate.map(entry => ({
        beginningBalance: beginningBalance._id,
        line: entry.line,
        acctCode: entry.acctCodeId,
        debit: entry.debit,
        credit: entry.credit,
      }));

      const savedEntries = await BeginningBalanceEntry.insertMany(entries, { session });
      if (savedEntries.length !== entries.length) throw new CustomError("Failed to create beginning balance", 500);

      savedEntries.map(entry => updatedIds.push(`${entry._id}`));
      const entryIds = savedEntries.map(entry => entry._id);
      await activityLogServ.bulk_create({
        ids: entryIds,
        author: author._id,
        username: author.username,
        activity: `created a beginning balance entry`,
        resource: `beginning balance - entry`,
        session,
      });
    }

    if (toUpdate.length > 0) {
      const updates = toUpdate.map(entry => ({
        updateOne: {
          filter: { _id: entry._id, deletedAt: null, beginningBalance: beginningBalance._id },
          update: {
            $set: {
              line: entry.line,
              acctCode: entry.acctCodeId,
              debit: entry.debit,
              credit: entry.credit,
            },
          },
        },
      }));

      const updateds = await BeginningBalanceEntry.bulkWrite(updates, { session });
      if (updateds.matchedCount !== updates.length) {
        throw new CustomError("Failed to update the beginning balance  receipt", 500);
      }
      toUpdate.map(entry => updatedIds.push(entry._id));
      const entryIds = toUpdate.map(entry => entry._id);
      await activityLogServ.bulk_create({
        ids: entryIds,
        author: author._id,
        username: author.username,
        activity: `updated a beginning balance entry`,
        resource: `beginning balance - entry`,
        session,
      });
    }

    if (data.deletedIds && data.deletedIds.length > 0) {
      const deleted = await BeginningBalanceEntry.updateMany(
        { _id: { $in: data.deletedIds }, deletedAt: { $exists: false } },
        { deletedAt: new Date().toISOString() },
        { session }
      ).exec();
      if (deleted.matchedCount !== data.deletedIds.length) {
        throw new CustomError("Failed to update the beginning balance", 500);
      }
      await activityLogServ.bulk_create({
        ids: data.deletedIds,
        author: author._id,
        username: author.username,
        activity: `deleted a beginning balance entry`,
        resource: `beginning balance - entry`,
        session,
      });
    }

    const entries = await BeginningBalanceEntry.find({ _id: { $in: updatedIds } })
      .session(session)
      .lean()
      .exec();

    beginningBalance.debit = entries.reduce((acc, obj) => (acc += Number(obj.debit)), 0);
    beginningBalance.credit = entries.reduce((acc, obj) => (acc += Number(obj.credit)), 0);
    beginningBalance.entryCount = entries.length;
    beginningBalance.save({ session });

    await activityLogServ.create({
      author: author._id,
      username: author.username,
      activity: `updated a  beginning balance`,
      resource: `beginning balance`,
      dataId: beginningBalance._id,
      session,
    });

    await session.commitTransaction();

    return { success: true, beginningBalance };
  } catch (error) {
    await session.abortTransaction();
    throw new CustomError(error.message || "Failed to create beginning balance", error.statusCode || 500);
  } finally {
    await session.endSession();
  }
};

exports.delete = async (id, author) => {
  const deleted = await BeginningBalance.findOneAndUpdate({ _id: id, deletedAt: null }, { $set: { deletedAt: new Date().toISOString() } }).exec();
  if (!deleted) throw new CustomError("Failed to delete the damayan fund", 500);
  await BeginningBalanceEntry.updateMany({ beginningBalance: deleted._id }, { $set: { deletedAt: new Date().toISOString() } }).exec();

  await activityLogServ.create({
    author: author._id,
    username: author.username,
    activity: `deleted an beginning balance along with its linked entries`,
    resource: `beginning balance`,
    dataId: deleted._id,
  });

  return { success: true, beginningBalance: id };
};

exports.get_entries_by_account_code = async (year, keyword, limit, page, offset, withAmount) => {
  const filter = {
    deletedAt: null,
    $or: [{ code: new RegExp(keyword, "i") }, { description: new RegExp(keyword, "i") }],
  };

  const pipelines = [];
  pipelines.push({ $match: filter });
  pipelines.push(...generatedBeginningBalanceEntries(year));

  let projects = { code: 1, description: 1, debit: { $toInt: "0" }, credit: { $toInt: "0" } };
  if (withAmount) {
    projects.debit = { $sum: { $ifNull: ["$entries.debit", 0] } };
    projects.credit = { $sum: { $ifNull: ["$entries.credit", 0] } };
  }

  pipelines.push({ $project: projects });

  pipelines.push({ $skip: offset });
  pipelines.push({ $limit: limit });

  const chartOfAccountsPromise = await ChartOfAccount.aggregate(pipelines).exec();
  const countPromise = ChartOfAccount.countDocuments(filter);

  const [count, chartOfAccounts] = await Promise.all([countPromise, chartOfAccountsPromise]);

  const hasNextPage = count > offset + limit;
  const hasPrevPage = page > 1;
  const totalPages = Math.ceil(count / limit);

  return {
    success: true,
    chartOfAccounts,
    hasNextPage,
    hasPrevPage,
    totalPages,
  };
};

exports.get_entries_by_year = async (year, withAmount) => {
  const beginningBalance = await BeginningBalance.findOne({ year, deletedAt: null }).lean().exec();
  const entries = await BeginningBalanceEntry.find({ beginningBalance: beginningBalance._id, deletedAt: null }).lean().exec();
  const accountsCodes = entries.map(e => e.acctCode);

  const pipelines = [];
  pipelines.push({ $match: { _id: { $in: accountsCodes } } });
  pipelines.push(...generatedBeginningBalanceEntries(year));

  let projects = { code: 1, description: 1, debit: { $toInt: "0" }, credit: { $toInt: "0" } };
  if (withAmount) {
    projects.debit = { $sum: { $ifNull: ["$entries.debit", 0] } };
    projects.credit = { $sum: { $ifNull: ["$entries.credit", 0] } };
  }

  pipelines.push({ $project: projects });

  const chartOfAccounts = await ChartOfAccount.aggregate(pipelines).exec();

  return chartOfAccounts;
};

const generatedBeginningBalanceEntries = year => {
  const entryPipelines = [];

  entryPipelines.push({ ...generateBeginningBalanceEntryPipeline("entries", { targetYear: year, reference: "transactions", field: "transaction", alias: "lre" }) });
  entryPipelines.push({
    ...generateBeginningBalanceEntryPipeline("journalvoucherentries", { targetYear: year, reference: "journalvouchers", field: "journalVoucher", alias: "jve" }),
  });
  entryPipelines.push({
    ...generateBeginningBalanceEntryPipeline("expensevoucherentries", { targetYear: year, reference: "expensevouchers", field: "expenseVoucher", alias: "eve" }),
  });
  entryPipelines.push({
    ...generateBeginningBalanceEntryPipeline("acknowledgemententries", { targetYear: year, reference: "acknowledgements", field: "acknowledgement", alias: "ore" }),
  });
  entryPipelines.push({ ...generateBeginningBalanceEntryPipeline("releaseentries", { targetYear: year, reference: "releases", field: "release", alias: "ace" }) });
  entryPipelines.push({
    ...generateBeginningBalanceEntryPipeline("emergencyloanentries", { targetYear: year, reference: "emergencyloans", field: "emergencyLoan", alias: "ele" }),
  });
  entryPipelines.push({ ...generateBeginningBalanceEntryPipeline("damayanfundentries", { targetYear: year, reference: "damayanfunds", field: "damayanFund", alias: "dfe" }) });
  entryPipelines.push({ $addFields: { entries: { $concatArrays: ["$lre", "$jve", "$eve", "$ore", "$ace", "$ele", "$dfe"] } } });
  entryPipelines.push({ $project: { code: 1, description: 1, entries: 1 } });

  return entryPipelines;
};

const generateBeginningBalanceEntryPipeline = (collection, config) => {
  const { targetYear, reference, field, alias } = config;

  return {
    $lookup: {
      from: `${collection}`,
      let: { acctCodeId: "$_id", targetYear },
      pipeline: [
        { $match: { $expr: { $eq: ["$acctCode", "$$acctCodeId"] } } },
        { $lookup: { from: `${reference}`, foreignField: "_id", localField: `${field}`, as: `${field}` } },
        { $addFields: { [field]: { $arrayElemAt: [`$${field}`, 0] } } },
        { $unwind: `$${field}` },
        { $match: { $expr: { $eq: [{ $year: `$${field}.date` }, "$$targetYear"] } } },
        { $project: { [field]: 0 } },
      ],
      as: `${alias}`,
    },
  };
};

exports.print_by_year = async year => {
  const beginningBalance = await BeginningBalance.findOne({ year }).lean().exec();
  const entries = await BeginningBalanceEntry.find({ beginningBalance: beginningBalance._id })
    .populate({
      path: "acctCode",
      select: "code description",
    })
    .sort({ "acctCode.code": 1 })
    .lean()
    .exec();

  return { beginningBalance, entries };
};
