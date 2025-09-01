const CustomError = require("../../utils/custom-error.js");
const activityLogServ = require("../activity-logs/activity-log.service.js");
const Release = require("./release.schema.js");
const { default: mongoose } = require("mongoose");
const ReleaseEntry = require("./entries/release-entries.schema.js");

exports.get_selections = async (keyword, limit, page, offset) => {
  const filter = { deletedAt: null, code: new RegExp(keyword, "i") };

  const releasesPromise = Release.find(filter, { code: 1 }).skip(offset).limit(limit).lean().exec();
  const countPromise = Release.countDocuments(filter);

  const [count, releases] = await Promise.all([countPromise, releasesPromise]);

  const hasNextPage = count > offset + limit;
  const hasPrevPage = page > 1;
  const totalPages = Math.ceil(count / limit);

  return {
    success: true,
    releases,
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

  const query = Release.find(filter);
  if (sort && ["code-asc", "code-desc"].includes(sort)) query.sort({ code: sort === "code-asc" ? 1 : -1 });
  else query.sort({ createdAt: -1 });

  const countPromise = Release.countDocuments(filter);
  const releasesPromise = query
    .populate({ path: "bankCode", select: "code description" })
    .populate({ path: "center", select: "centerNo description" })
    .populate({ path: "encodedBy", select: "-_id username" })
    .skip(offset)
    .limit(limit)
    .exec();

  const [count, releases] = await Promise.all([countPromise, releasesPromise]);

  const hasNextPage = count > offset + limit;
  const hasPrevPage = page > 1;
  const totalPages = Math.ceil(count / limit);

  return {
    success: true,
    releases,
    hasNextPage,
    hasPrevPage,
    totalPages,
  };
};

exports.create = async (data, author) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const newRelease = await new Release({
      code: data.code.toUpperCase(),
      center: data.center,
      refNo: data.refNumber,
      remarks: data.remarks,
      type: data.type,
      acctOfficer: data.acctOfficer,
      date: data.date,
      acctMonth: data.acctMonth,
      acctYear: data.acctYear,
      checkNo: data.checkNo,
      checkDate: data.checkDate,
      bankCode: data.bankCode,
      amount: data.amount,
      cashCollectionAmount: data.cashCollection,
      encodedBy: author._id,
    }).save({ session });

    if (!newRelease) {
      throw new CustomError("Failed to save acknowledgement receipt");
    }

    const entries = data.entries.map(entry => ({
      release: newRelease._id,
      loanReleaseEntryId: entry.loanReleaseEntryId || null,
      acctCode: entry.acctCodeId,
      particular: entry.particular,
      debit: entry.debit,
      credit: entry.credit,
      encodedBy: author._id,
    }));

    const addedEntries = await ReleaseEntry.insertMany(entries, { session });

    if (addedEntries.length !== entries.length) {
      throw new CustomError("Failed to save acknowledgement receipt");
    }

    const _ids = addedEntries.map(entry => entry._id);

    const release = await Release.findById(newRelease._id)
      .populate({ path: "bankCode", select: "code description" })
      .populate({ path: "center", select: "centerNo description" })
      .populate({ path: "encodedBy", select: "-_id username" })
      .session(session)
      .exec();

    await activityLogServ.create({
      author: author._id,
      username: author.username,
      activity: `created an acknowledgement receipt`,
      resource: `acknowledgement receipt`,
      dataId: release._id,
      session,
    });

    await Promise.all(
      _ids.map(async id => {
        await activityLogServ.create({
          author: author._id,
          username: author.username,
          activity: `created a acknowledgement receipt entry`,
          resource: `acknowledgement receipt - entry`,
          dataId: id,
          session,
        });
      })
    );

    await session.commitTransaction();
    return {
      release,
      success: true,
    };
  } catch (error) {
    await session.abortTransaction();
    throw new CustomError(error.message || "Failed to create a acknowledgement receipt", error.statusCode || 500);
  } finally {
    await session.endSession();
  }
};

exports.update = async (id, data, author) => {
  const filter = { deletedAt: null, _id: id };
  const updates = {
    $set: {
      code: data.code.toUpperCase(),
      center: data.center,
      refNo: data.refNumber,
      remarks: data.remarks,
      type: data.type,
      acctOfficer: data.acctOfficer,
      date: data.date,
      acctMonth: data.acctMonth,
      acctYear: data.acctYear,
      checkNo: data.checkNo,
      checkDate: data.checkDate,
      bank: data.bankCode,
      amount: data.amount,
      cashCollectionAmount: data.cashCollection,
    },
  };
  const options = { new: true };

  const entryToUpdate = data.entries.filter(entry => entry._id);
  const entryToCreate = data.entries.filter(entry => !entry._id);

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const updated = await Release.findOneAndUpdate(filter, updates, options)
      .populate({ path: "bankCode", select: "code description" })
      .populate({ path: "center", select: "centerNo description" })
      .populate({ path: "encodedBy", select: "-_id username" })
      .lean()
      .exec();

    if (!updated) {
      throw new CustomError("Failed to update the release", 500);
    }

    if (entryToCreate.length > 0) {
      const newEntries = entryToCreate.map(entry => ({
        release: updated._id,
        loanReleaseEntryId: entry.loanReleaseEntryId || null,
        acctCode: entry.acctCodeId,
        particular: entry.particular,
        debit: entry.debit,
        credit: entry.credit,
        encodedBy: author._id,
      }));

      const added = await ReleaseEntry.insertMany(newEntries, { session });
      if (added.length !== newEntries.length) {
        throw new CustomError("Failed to update the acknowledgement receipt", 500);
      }
    }

    if (data.deletedIds && data.deletedIds.length > 0) {
      const deleted = await ReleaseEntry.updateMany({ _id: { $in: data.deletedIds }, deletedAt: { $exists: false } }, { deletedAt: new Date().toISOString() }, { session }).exec();
      if (deleted.matchedCount !== data.deletedIds.length) {
        throw new CustomError("Failed to update the acknowledgement receipt", 500);
      }
    }

    if (entryToUpdate.length > 0) {
      const updates = entryToUpdate.map(entry => ({
        updateOne: {
          filter: { _id: entry._id },
          update: {
            $set: {
              loanReleaseEntryId: entry.loanReleaseEntryId || null,
              acctCode: entry.acctCodeId,
              particular: entry.particular,
              debit: entry.debit,
              credit: entry.credit,
            },
          },
        },
      }));
      const updateds = await ReleaseEntry.bulkWrite(updates, { session });
      if (updateds.matchedCount !== updates.length) {
        throw new CustomError("Failed to update the acknowledgement receipt", 500);
      }
    }

    const latestEntries = await ReleaseEntry.find({ release: updated._id, deletedAt: null }).session(session).lean().exec();
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
      activity: `updated an acknowledgement receipt`,
      resource: `acknowledgement receipt`,
      dataId: updated._id,
      session,
    });

    await session.commitTransaction();

    return {
      success: true,
      release: updated,
    };
  } catch (error) {
    await session.abortTransaction();
    throw new CustomError(error.message || "Failed to update acknowledgement receipt", error.statusCode || 500);
  } finally {
    await session.endSession();
  }
};

exports.delete = async (filter, author) => {
  const deleted = await Release.findOneAndUpdate(filter, { $set: { deletedAt: new Date().toISOString() } }).exec();
  if (!deleted) {
    throw new CustomError("Failed to delete the acknowledgement receipt", 500);
  }

  await ReleaseEntry.updateMany({ release: deleted._id }, { $set: { deletedAt: new Date().toISOString() } }).exec();

  await activityLogServ.create({
    author: author._id,
    username: author.username,
    activity: `deleted a acknowledgement receipt along with its linked gl entries`,
    resource: `acknowledgement receipt`,
    dataId: deleted._id,
  });

  return { success: true, release: filter._id };
};

exports.print_all_detailed = async (docNoFrom, docNoTo) => {
  const pipelines = [];
  const filter = { deletedAt: null };
  if (docNoFrom || docNoTo) filter.$and = [];
  if (docNoFrom) filter.$and.push({ code: { $gte: docNoFrom } });
  if (docNoTo) filter.$and.push({ code: { $lte: docNoTo } });

  pipelines.push({ $match: filter });
  pipelines.push({ $sort: { code: 1 } });
  pipelines.push({ $lookup: { from: "banks", localField: "bankCode", foreignField: "_id", as: "bank", pipeline: [{ $project: { code: 1, description: 1 } }] } });
  pipelines.push({ $lookup: { from: "centers", localField: "center", foreignField: "_id", as: "center", pipeline: [{ $project: { centerNo: 1, description: 1 } }] } });
  pipelines.push({ $addFields: { bankCode: { $arrayElemAt: ["$bank", 0] }, center: { $arrayElemAt: ["$center", 0] } } });

  pipelines.push({
    $lookup: {
      from: "releaseentries",
      let: { localField: "$_id" },
      pipeline: [
        { $match: { $expr: { $eq: ["$$localField", "$release"] }, deletedAt: null } },
        { $lookup: { from: "chartofaccounts", localField: "acctCode", foreignField: "_id", as: "acctCode", pipeline: [{ $project: { code: 1, description: 1 } }] } },
        { $addFields: { acctCode: { $arrayElemAt: ["$acctCode", 0] } } },
        { $project: { createdAt: 0, updatedAt: 0, __v: 0, encodedBy: 0, acknowledgement: 0 } },
      ],
      as: "entries",
    },
  });

  pipelines.push({ $project: { createdAt: 0, updatedAt: 0, __v: 0, type: 0, encodedBy: 0 } });

  const releases = await Release.aggregate(pipelines).exec();

  return releases;
};

exports.print_detailed_by_id = async transactionId => {
  const pipelines = [];
  const filter = { deletedAt: null, _id: new mongoose.Types.ObjectId(transactionId) };

  pipelines.push({ $match: filter });

  pipelines.push({ $sort: { code: 1 } });

  pipelines.push({ $lookup: { from: "banks", localField: "bankCode", foreignField: "_id", as: "bank", pipeline: [{ $project: { code: 1, description: 1 } }] } });
  pipelines.push({ $lookup: { from: "centers", localField: "center", foreignField: "_id", as: "center", pipeline: [{ $project: { centerNo: 1, description: 1 } }] } });
  pipelines.push({ $addFields: { bankCode: { $arrayElemAt: ["$bank", 0] }, center: { $arrayElemAt: ["$center", 0] } } });

  pipelines.push({
    $lookup: {
      from: "releaseentries",
      let: { localField: "$_id" },
      pipeline: [
        { $match: { $expr: { $eq: ["$$localField", "$release"] }, deletedAt: null } },
        { $lookup: { from: "chartofaccounts", localField: "acctCode", foreignField: "_id", as: "acctCode", pipeline: [{ $project: { code: 1, description: 1 } }] } },
        { $addFields: { acctCode: { $arrayElemAt: ["$acctCode", 0] } } },
        { $project: { createdAt: 0, updatedAt: 0, __v: 0, encodedBy: 0, acknowledgement: 0 } },
      ],
      as: "entries",
    },
  });

  pipelines.push({ $project: { createdAt: 0, updatedAt: 0, __v: 0, type: 0, encodedBy: 0 } });

  const releases = await Release.aggregate(pipelines).exec();

  return releases;
};

exports.print_all_summary = async (docNoFrom, docNoTo) => {
  const filter = { deletedAt: null };
  if (docNoFrom || docNoTo) filter.$and = [];
  if (docNoFrom) filter.$and.push({ code: { $gte: docNoFrom } });
  if (docNoTo) filter.$and.push({ code: { $lte: docNoTo } });

  const releases = await Release.find(filter).populate({ path: "center" }).populate({ path: "bankCode" }).sort({ code: 1 });

  return releases;
};

exports.print_summary_by_id = async transactionId => {
  const filter = { deletedAt: null, _id: transactionId };
  const releases = await Release.find(filter).populate({ path: "center" }).populate({ path: "bankCode" }).sort({ code: 1 });
  return releases;
};

exports.print_file = async id => {
  const release = await Release.findOne({ _id: id, deletedAt: null }).populate("center").populate("bankCode").lean().exec();
  const entries = await ReleaseEntry.find({ release: release._id, deletedAt: null }).populate("acctCode").lean().exec();
  let payTo = `${release.center.description}`;

  return { success: true, release, entries, payTo };
};
