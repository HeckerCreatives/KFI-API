const CustomError = require("../../utils/custom-error.js");
const JournalVoucherEntry = require("./entries/journal-voucher-entries.schema.js");
const JournalVoucher = require("./journal-voucher.schema.js");
const activityLogServ = require("../activity-logs/activity-log.service.js");
const { default: mongoose } = require("mongoose");
const { isAmountTally } = require("../../utils/tally-amount.js");
const { DateTime } = require("luxon");
const { isValidDate } = require("../../utils/date.js");
const SignatureParam = require("../system-parameters/signature-param.js");
const Bank = require("../banks/bank.schema.js");
const ChartOfAccount = require("../chart-of-account/chart-of-account.schema.js");

exports.get_selections = async (keyword, limit, page, offset) => {
  const filter = { deletedAt: null, code: new RegExp(keyword, "i") };

  const journalVouchersPromise = JournalVoucher.find(filter, { code: 1 }).skip(offset).limit(limit).lean().exec();
  const countPromise = JournalVoucher.countDocuments(filter);

  const [count, journalVouchers] = await Promise.all([countPromise, journalVouchersPromise]);

  const hasNextPage = count > offset + limit;
  const hasPrevPage = page > 1;
  const totalPages = Math.ceil(count / limit);

  return {
    success: true,
    journalVouchers,
    hasNextPage,
    hasPrevPage,
    totalPages,
  };
};

exports.get_all = async (limit, page, offset, keyword, sort, to, from) => {
  const filter = { deletedAt: null };
  if (keyword) filter.code = new RegExp(keyword, "i");

  if (to && from) {
    filter.date = { $gte: new Date(from), $lte: new Date(to) };
  } else if (to) {
    filter.date = { $lte: new Date(to) };
  } else if (from) {
    filter.date = { $gte: new Date(from) };
  }

  const query = JournalVoucher.find(filter);
  if (sort && ["code-asc", "code-desc"].includes(sort)) query.sort({ code: sort === "code-asc" ? 1 : -1 });
  else query.sort({ createdAt: -1 });

  const countPromise = JournalVoucher.countDocuments(filter);
  const journalVoucherPromise = query
    .populate({ path: "bankCode", select: "code description" })
    .populate({ path: "encodedBy", select: "-_id username" })
    .skip(offset)
    .limit(limit)
    .exec();

  const [count, journalVouchers] = await Promise.all([countPromise, journalVoucherPromise]);

  const hasNextPage = count > offset + limit;
  const hasPrevPage = page > 1;
  const totalPages = Math.ceil(count / limit);

  return {
    success: true,
    journalVouchers,
    hasNextPage,
    hasPrevPage,
    totalPages,
  };
};

exports.get_single = async filter => {
  const journalVoucher = await JournalVoucher.findOne(filter).exec();
  if (!journalVoucher) {
    throw new CustomError("Journal voucher not found", 404);
  }
  return { success: true, journalVoucher };
};

exports.create = async (data, author) => {
  const signature = await SignatureParam.findOne({ type: "journal voucher" }).lean().exec();

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
  }).save();
  if (!newJournalVoucher) {
    throw new CustomError("Failed to create a new journal voucher", 500);
  }

  const entries = data.entries.map(entry => ({
    line: entry.line,
    journalVoucher: newJournalVoucher._id,
    client: entry.client || null,
    particular: entry.particular || null,
    acctCode: entry.acctCodeId,
    debit: entry.debit,
    credit: entry.credit,
    cvForRecompute: entry.cvForRecompute,
    encodedBy: author._id,
  }));

  const addedEntries = await JournalVoucherEntry.insertMany(entries);

  if (addedEntries.length !== entries.length) {
    throw new CustomError("Failed to save journal voucher");
  }

  const _ids = addedEntries.map(entry => entry._id);

  const journalVoucher = await JournalVoucher.findById(newJournalVoucher._id)
    .populate({ path: "bankCode", select: "code description" })
    .populate({ path: "encodedBy", select: "-_id username" })
    .exec();

  await activityLogServ.create({
    author: author._id,
    username: author.username,
    activity: `created a journal voucher`,
    resource: `journal voucher`,
    dataId: journalVoucher._id,
  });

  await Promise.all(
    _ids.map(async id => {
      await activityLogServ.create({
        author: author._id,
        username: author.username,
        activity: `created a journal voucher entry`,
        resource: `journal voucher - entry`,
        dataId: id,
      });
    })
  );

  return {
    success: true,
    journalVoucher: journalVoucher,
  };
};

exports.update = async (filter, data, author) => {
  const entryToUpdate = data.entries.filter(entry => entry._id);
  const entryToCreate = data.entries.filter(entry => !entry._id);

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const updated = await JournalVoucher.findOneAndUpdate(
      filter,
      {
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
      },
      { new: true }
    )
      .populate({ path: "bankCode", select: "code description" })
      .populate({ path: "encodedBy", select: "-_id username" })
      .lean()
      .exec();

    if (!updated) {
      throw new CustomError("Failed to update the journal voucher", 500);
    }

    if (entryToCreate.length > 0) {
      const newEntries = entryToCreate.map(entry => ({
        line: entry.line,
        journalVoucher: updated._id,
        client: entry.client || null,
        particular: entry.particular,
        acctCode: entry.acctCodeId,
        debit: entry.debit,
        credit: entry.credit,
        cvForRecompute: entry.cvForRecompute,
        encodedBy: author._id,
      }));

      const added = await JournalVoucherEntry.insertMany(newEntries, { session });
      if (added.length !== newEntries.length) {
        throw new CustomError("Failed to update the journal voucher", 500);
      }
    }

    if (data.deletedIds && data.deletedIds.length > 0) {
      const deleted = await JournalVoucherEntry.updateMany(
        { _id: { $in: data.deletedIds }, deletedAt: { $exists: false } },
        { deletedAt: new Date().toISOString() },
        { session }
      ).exec();
      if (deleted.matchedCount !== data.deletedIds.length) {
        throw new CustomError("Failed to update the journal voucher", 500);
      }
    }

    if (entryToUpdate.length > 0) {
      const updates = entryToUpdate.map(entry => ({
        updateOne: {
          filter: { _id: entry._id },
          update: {
            $set: {
              line: entry.line,
              client: entry.client || null,
              particular: entry.particular,
              acctCode: entry.acctCodeId,
              debit: entry.debit,
              credit: entry.credit,
              cvForRecompute: entry.cvForRecompute,
            },
          },
        },
      }));
      const updateds = await JournalVoucherEntry.bulkWrite(updates, { session });
      if (updateds.matchedCount !== updates.length) {
        throw new CustomError("Failed to update the journal voucher", 500);
      }
    }

    const latestEntries = await JournalVoucherEntry.find({ journalVoucher: updated._id, deletedAt: null }).populate("acctCode").session(session).lean().exec();
    const { debitCreditBalanced, netDebitCreditBalanced, netAmountBalanced } = isAmountTally(latestEntries, updated.amount);
    if (!debitCreditBalanced) throw new CustomError("Debit and Credit must be balanced.", 400);
    if (!netDebitCreditBalanced) throw new CustomError("Please check all the amount in the entries", 400);
    if (!netAmountBalanced) throw new CustomError("Amount and Net Amount must be balanced", 400);

    await activityLogServ.create({
      author: author._id,
      username: author.username,
      activity: `update a journal voucher`,
      resource: `journal voucher`,
      dataId: updated._id,
      session,
    });

    await session.commitTransaction();

    return {
      success: true,
      journalVoucher: updated,
    };
  } catch (error) {
    await session.abortTransaction();
    throw new CustomError(error.message || "Failed to update journal voucher", error.statusCode || 500);
  } finally {
    await session.endSession();
  }
};

exports.delete = async (filter, author) => {
  const deleted = await JournalVoucher.findOneAndUpdate(filter, { $set: { deletedAt: new Date().toISOString() } }).exec();
  if (!deleted) throw new CustomError("Failed to delete the journal voucher", 500);

  await JournalVoucherEntry.updateMany({ journalVoucher: deleted._id }, { $set: { deletedAt: new Date().toISOString() } }).exec();

  await activityLogServ.create({
    author: author._id,
    username: author.username,
    activity: `deleted a journal voucher along with its linked gl entries`,
    resource: `journal voucher`,
    dataId: deleted._id,
  });

  return { success: true, expenseVoucher: filter._id };
};

exports.print_all_detailed = async (docNoFrom, docNoTo) => {
  const pipelines = [];
  const filter = { deletedAt: null };
  if (docNoFrom || docNoTo) filter.$and = [];
  if (docNoFrom) filter.$and.push({ code: { $gte: docNoFrom } });
  if (docNoTo) filter.$and.push({ code: { $lte: docNoTo } });

  pipelines.push({ $match: filter });

  pipelines.push({ $sort: { code: 1 } });

  pipelines.push({ $lookup: { from: "banks", localField: "bankCode", foreignField: "_id", as: "bankCode", pipeline: [{ $project: { code: 1, description: 1 } }] } });

  // pipelines.push({ $lookup: { from: "suppliers", localField: "supplier", foreignField: "_id", as: "supplier", pipeline: [{ $project: { code: 1, description: 1 } }] } });

  pipelines.push({ $addFields: { bankCode: { $arrayElemAt: ["$bankCode", 0] }, supplier: { $arrayElemAt: ["$supplier", 0] } } });

  pipelines.push({
    $lookup: {
      from: "journalvoucherentries",
      let: { localField: "$_id" },
      pipeline: [
        { $match: { $expr: { $eq: ["$$localField", "$journalVoucher"] }, deletedAt: null } },
        { $lookup: { from: "chartofaccounts", localField: "acctCode", foreignField: "_id", as: "acctCode", pipeline: [{ $project: { code: 1, description: 1 } }] } },
        { $addFields: { acctCode: { $arrayElemAt: ["$acctCode", 0] } } },
        { $project: { createdAt: 0, updatedAt: 0, __v: 0, encodedBy: 0, expenseVoucher: 0 } },
      ],
      as: "entries",
    },
  });

  pipelines.push({ $project: { createdAt: 0, updatedAt: 0, __v: 0, type: 0, encodedBy: 0 } });

  const journalVouchers = await JournalVoucher.aggregate(pipelines).exec();

  return journalVouchers;
};

exports.print_all_detailed_by_date = async (dateFrom, dateTo) => {
  const pipelines = [];
  const filter = { deletedAt: null };
  if (dateFrom || dateTo) filter.$and = [];

  if (dateFrom && isValidDate(dateFrom)) {
    let fromDate = new Date(dateFrom);
    fromDate.setHours(0, 0, 0, 0);
    filter.$and.push({ date: { $gte: fromDate } });
  }

  if (dateTo && isValidDate(dateTo)) {
    let toDate = new Date(dateTo);
    toDate.setHours(23, 59, 59, 999);
    filter.$and.push({ date: { $lte: new Date(toDate) } });
  }

  pipelines.push({ $match: filter });

  pipelines.push({ $sort: { date: 1 } });

  pipelines.push({ $lookup: { from: "banks", localField: "bankCode", foreignField: "_id", as: "bankCode", pipeline: [{ $project: { code: 1, description: 1 } }] } });

  pipelines.push({ $addFields: { bankCode: { $arrayElemAt: ["$bankCode", 0] }, supplier: { $arrayElemAt: ["$supplier", 0] } } });

  pipelines.push({
    $lookup: {
      from: "journalvoucherentries",
      let: { localField: "$_id" },
      pipeline: [
        { $match: { $expr: { $eq: ["$$localField", "$journalVoucher"] }, deletedAt: null } },
        { $lookup: { from: "chartofaccounts", localField: "acctCode", foreignField: "_id", as: "acctCode", pipeline: [{ $project: { code: 1, description: 1 } }] } },
        {
          $lookup: {
            from: "customers",
            localField: "client",
            foreignField: "_id",
            as: "client",
            pipeline: [{ $lookup: { from: "centers", localField: "center", foreignField: "_id", as: "center" } }, { $addFields: { center: { $arrayElemAt: ["$center", 0] } } }],
          },
        },
        { $addFields: { acctCode: { $arrayElemAt: ["$acctCode", 0] }, client: { $arrayElemAt: ["$client", 0] } } },
        { $project: { createdAt: 0, updatedAt: 0, __v: 0, encodedBy: 0, expenseVoucher: 0 } },
      ],
      as: "entries",
    },
  });

  pipelines.push({ $project: { createdAt: 0, updatedAt: 0, __v: 0, type: 0, encodedBy: 0 } });

  const journalVouchers = await JournalVoucher.aggregate(pipelines).exec();

  return journalVouchers;
};

exports.print_all_summarized_by_date = async (dateFrom, dateTo) => {
  const pipelines = [];
  const filter = { deletedAt: null };

  if (dateFrom || dateTo) filter.$and = [];

  if (dateFrom && isValidDate(dateFrom)) {
    let fromDate = new Date(dateFrom);
    fromDate.setHours(0, 0, 0, 0);
    filter.$and.push({ date: { $gte: fromDate } });
  }

  if (dateTo && isValidDate(dateTo)) {
    let toDate = new Date(dateTo);
    toDate.setHours(23, 59, 59, 999);
    filter.$and.push({ date: { $lte: new Date(toDate) } });
  }

  pipelines.push({ $match: filter });
  pipelines.push({ $group: { _id: "$date", journals: { $push: "$$ROOT" } } });
  pipelines.push({ $sort: { _id: 1 } });

  const journalVouchers = await JournalVoucher.aggregate(pipelines).exec();

  return journalVouchers;
};

exports.print_detailed_by_id = async journalVoucherId => {
  const pipelines = [];
  const filter = { deletedAt: null, _id: new mongoose.Types.ObjectId(journalVoucherId) };

  pipelines.push({ $match: filter });

  pipelines.push({ $sort: { code: 1 } });

  pipelines.push({ $lookup: { from: "banks", localField: "bankCode", foreignField: "_id", as: "bankCode", pipeline: [{ $project: { code: 1, description: 1 } }] } });

  pipelines.push({ $lookup: { from: "suppliers", localField: "supplier", foreignField: "_id", as: "supplier", pipeline: [{ $project: { code: 1, description: 1 } }] } });

  pipelines.push({ $addFields: { bankCode: { $arrayElemAt: ["$bankCode", 0] }, supplier: { $arrayElemAt: ["$supplier", 0] } } });

  pipelines.push({
    $lookup: {
      from: "journalvoucherentries",
      let: { localField: "$_id" },
      pipeline: [
        { $match: { $expr: { $eq: ["$$localField", "$journalVoucher"] }, deletedAt: null } },
        { $lookup: { from: "chartofaccounts", localField: "acctCode", foreignField: "_id", as: "acctCode", pipeline: [{ $project: { code: 1, description: 1 } }] } },
        { $addFields: { acctCode: { $arrayElemAt: ["$acctCode", 0] } } },
        { $project: { createdAt: 0, updatedAt: 0, __v: 0, encodedBy: 0, expenseVoucher: 0 } },
      ],
      as: "entries",
    },
  });

  pipelines.push({ $project: { createdAt: 0, updatedAt: 0, __v: 0, type: 0, encodedBy: 0 } });

  const journalVouchers = await JournalVoucher.aggregate(pipelines).exec();

  return journalVouchers;
};

exports.print_all_summary = async (docNoFrom, docNoTo) => {
  const filter = { deletedAt: null };
  if (docNoFrom || docNoTo) filter.$and = [];
  if (docNoFrom) filter.$and.push({ code: { $gte: docNoFrom } });
  if (docNoTo) filter.$and.push({ code: { $lte: docNoTo } });
  const journalVouchers = await JournalVoucher.find(filter).populate({ path: "bankCode" }).sort({ code: 1 });
  return journalVouchers;
};

exports.print_summary_by_id = async journalVoucherId => {
  const filter = { deletedAt: null, _id: journalVoucherId };
  const journalVouchers = await JournalVoucher.find(filter).populate({ path: "bankCode" }).sort({ code: 1 });
  return journalVouchers;
};

exports.print_file = async transactionId => {
  const journal = await JournalVoucher.findOne({ _id: transactionId, deletedAt: null }).populate("bankCode").lean().exec();
  const entries = await JournalVoucherEntry.find({ journalVoucher: journal._id, deletedAt: null }).populate("client").populate("acctCode").lean().exec();
  let payTo = `${journal.nature}`;

  return { success: true, journal, entries, payTo };
};

exports.print_all_by_bank = async bankIds => {
  const pipelines = [];

  pipelines.push({ $match: { deletedAt: null, _id: { $in: bankIds } } });

  pipelines.push({
    $lookup: {
      from: "journalvouchers",
      let: { localField: "$_id" },
      pipeline: [{ $match: { $expr: { $eq: ["$$localField", "$bankCode"] }, deletedAt: null } }],
      as: "journals",
    },
  });

  const banks = await Bank.aggregate(pipelines).exec();

  return banks;
};

exports.print_by_accounts = async (accounts, dateFrom, dateTo) => {
  const pipelines = [];
  const journalFilter = { deletedAt: null };
  const accountsFilter = { deletedAt: null, _id: { $in: accounts } };

  if (dateFrom || dateTo) journalFilter.$and = [];

  if (dateFrom && isValidDate(dateFrom)) {
    let fromDate = new Date(dateFrom);
    fromDate.setHours(0, 0, 0, 0);
    journalFilter.$and.push({ "journal.date": { $gte: fromDate } });
  }

  if (dateTo && isValidDate(dateTo)) {
    let toDate = new Date(dateTo);
    toDate.setHours(23, 59, 59, 999);
    journalFilter.$and.push({ "journal.date": { $lte: new Date(toDate) } });
  }

  pipelines.push({ $match: accountsFilter });
  pipelines.push({ $sort: { code: 1 } });
  pipelines.push({
    $lookup: {
      from: "journalvoucherentries",
      let: { acctCodeId: "$_id" },
      pipeline: [
        { $match: { $expr: { $eq: ["$acctCode", "$$acctCodeId"] } } },
        { $lookup: { from: "journalvouchers", localField: "journalVoucher", foreignField: "_id", as: "journal" } },
        { $lookup: { from: "customers", localField: "client", foreignField: "_id", as: "client" } },
        {
          $addFields: {
            journal: { $arrayElemAt: ["$journal", 0] },
            client: { $arrayElemAt: ["$client", 0] },
          },
        },
        { $match: journalFilter },
        { $sort: { "journal.date": 1 } },
      ],
      as: "entries",
    },
  });

  const journalVouchers = await ChartOfAccount.aggregate(pipelines).exec();

  return journalVouchers;
};
