const CustomError = require("../../utils/custom-error.js");
const JournalVoucherEntry = require("./entries/journal-voucher-entries.schema.js");
const JournalVoucher = require("./journal-voucher.schema.js");
const activityLogServ = require("../activity-logs/activity-log.service.js");
const { default: mongoose } = require("mongoose");

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
  }).save();
  if (!newJournalVoucher) {
    throw new CustomError("Failed to create a new journal voucher", 500);
  }

  const entries = data.entries.map(entry => ({
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
        expenseVoucher: updated._id,
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

    const latestEntries = await JournalVoucherEntry.find({ journalVoucher: updated._id, deletedAt: null }).session(session).lean().exec();
    let totalDebit = 0;
    let totalCredit = 0;
    latestEntries.map(entry => {
      totalDebit += Number(entry.debit);
      totalCredit += Number(entry.credit);
    });
    if (totalDebit !== totalCredit) throw new CustomError("Debit and Credit must be balanced.", 400);
    if (totalCredit !== updated.amount) throw new CustomError("Total of debit and credit must be balanced with the amount field.", 400);

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
