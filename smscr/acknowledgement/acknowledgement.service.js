const CustomError = require("../../utils/custom-error.js");
const activityLogServ = require("../activity-logs/activity-log.service.js");
const Acknowledgement = require("./acknowlegement.schema.js");
const { default: mongoose } = require("mongoose");
const AcknowledgementEntry = require("./entries/acknowledgement-entries.schema.js");

exports.get_selections = async (keyword, limit, page, offset) => {
  const filter = { deletedAt: null, code: new RegExp(keyword, "i") };

  const acknowledgementsPromise = Acknowledgement.find(filter, { code: 1 }).skip(offset).limit(limit).lean().exec();
  const countPromise = Acknowledgement.countDocuments(filter);

  const [count, acknowledgements] = await Promise.all([countPromise, acknowledgementsPromise]);

  const hasNextPage = count > offset + limit;
  const hasPrevPage = page > 1;
  const totalPages = Math.ceil(count / limit);

  return {
    success: true,
    acknowledgements,
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

  const query = Acknowledgement.find(filter);
  if (sort && ["code-asc", "code-desc"].includes(sort)) query.sort({ code: sort === "code-asc" ? 1 : -1 });
  else query.sort({ createdAt: -1 });

  const countPromise = Acknowledgement.countDocuments(filter);
  const acknowledgementsPromise = query
    .populate({ path: "bankCode", select: "code description" })
    .populate({ path: "center", select: "centerNo description" })
    .populate({ path: "encodedBy", select: "-_id username" })
    .skip(offset)
    .limit(limit)
    .exec();

  const [count, acknowledgements] = await Promise.all([countPromise, acknowledgementsPromise]);

  const hasNextPage = count > offset + limit;
  const hasPrevPage = page > 1;
  const totalPages = Math.ceil(count / limit);

  return {
    success: true,
    acknowledgements,
    hasNextPage,
    hasPrevPage,
    totalPages,
  };
};

exports.create = async (data, author) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const newAcknowledgement = await new Acknowledgement({
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

    if (!newAcknowledgement) {
      throw new CustomError("Failed to save acknowledgement");
    }

    const entries = data.entries.map(entry => ({
      acknowledgement: newAcknowledgement._id,
      loanReleaseEntryId: entry.loanReleaseEntryId || null,
      acctCode: entry.acctCodeId,
      particular: entry.particular,
      debit: entry.debit,
      credit: entry.credit,
      encodedBy: author._id,
    }));

    const addedEntries = await AcknowledgementEntry.insertMany(entries, { session });

    if (addedEntries.length !== entries.length) {
      throw new CustomError("Failed to save acknowledgement");
    }

    const _ids = addedEntries.map(entry => entry._id);

    const acknowledgement = await Acknowledgement.findById(newAcknowledgement._id)
      .populate({ path: "bankCode", select: "code description" })
      .populate({ path: "center", select: "centerNo description" })
      .populate({ path: "encodedBy", select: "-_id username" })
      .session(session)
      .exec();

    await activityLogServ.create({
      author: author._id,
      username: author.username,
      activity: `created an acknowledgement`,
      resource: `acknowledgement`,
      dataId: acknowledgement._id,
      session,
    });

    await Promise.all(
      _ids.map(async id => {
        await activityLogServ.create({
          author: author._id,
          username: author.username,
          activity: `created a acknowledgement entry`,
          resource: `acknowledgement - entry`,
          dataId: id,
          session,
        });
      })
    );

    await session.commitTransaction();
    return {
      acknowledgement,
      success: true,
    };
  } catch (error) {
    await session.abortTransaction();
    throw new CustomError(error.message || "Failed to create a acknowledgement", error.statusCode || 500);
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
  const updated = await Acknowledgement.findOneAndUpdate(filter, updates, options)
    .populate({ path: "bankCode", select: "code description" })
    .populate({ path: "center", select: "centerNo description" })
    .populate({ path: "encodedBy", select: "-_id username" })
    .lean()
    .exec();

  if (!updated) {
    throw new CustomError("Failed to update the acknowledgement", 500);
  }

  await activityLogServ.create({
    author: author._id,
    username: author.username,
    activity: `updated an acknowledgement`,
    resource: `acknowledgement`,
    dataId: updated._id,
  });

  return {
    success: true,
    acknowledgement: updated,
  };
};

exports.delete = async (filter, author) => {
  const deleted = await Acknowledgement.findOneAndUpdate(filter, { $set: { deletedAt: new Date().toISOString() } }).exec();
  if (!deleted) {
    throw new CustomError("Failed to delete the acknowledgement", 500);
  }

  await AcknowledgementEntry.updateMany({ acknowledgement: deleted._id }, { $set: { deletedAt: new Date().toISOString() } }).exec();

  await activityLogServ.create({
    author: author._id,
    username: author.username,
    activity: `deleted a acknowledgement along with its linked gl entries`,
    resource: `acknowledgement`,
    dataId: deleted._id,
  });

  return { success: true, acknowledgement: filter._id };
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
      from: "acknowledgemententries",
      let: { localField: "$_id" },
      pipeline: [
        { $match: { $expr: { $eq: ["$$localField", "$acknowledgement"] }, deletedAt: null } },
        { $lookup: { from: "chartofaccounts", localField: "acctCode", foreignField: "_id", as: "acctCode", pipeline: [{ $project: { code: 1, description: 1 } }] } },
        { $addFields: { acctCode: { $arrayElemAt: ["$acctCode", 0] } } },
        { $project: { createdAt: 0, updatedAt: 0, __v: 0, encodedBy: 0, acknowledgement: 0 } },
      ],
      as: "entries",
    },
  });

  pipelines.push({ $project: { createdAt: 0, updatedAt: 0, __v: 0, type: 0, encodedBy: 0 } });

  const transactions = await Acknowledgement.aggregate(pipelines).exec();

  return transactions;
};

exports.print_detailed_by_id = async transactionId => {
  const pipelines = [];
  const filter = { deletedAt: null, _id: new mongoose.Types.ObjectId(transactionId) };

  pipelines.push({ $match: filter });

  pipelines.push({ $sort: { code: 1 } });

  pipelines.push({ $lookup: { from: "banks", localField: "bank", foreignField: "_id", as: "bank", pipeline: [{ $project: { code: 1, description: 1 } }] } });
  pipelines.push({ $lookup: { from: "centers", localField: "center", foreignField: "_id", as: "center", pipeline: [{ $project: { centerNo: 1, description: 1 } }] } });
  pipelines.push({ $addFields: { bank: { $arrayElemAt: ["$bank", 0] }, center: { $arrayElemAt: ["$center", 0] } } });

  pipelines.push({
    $lookup: {
      from: "acknowledgemententries",
      let: { localField: "$_id" },
      pipeline: [
        { $match: { $expr: { $eq: ["$$localField", "$acknowledgement"] }, deletedAt: null } },
        { $lookup: { from: "chartofaccounts", localField: "acctCode", foreignField: "_id", as: "acctCode", pipeline: [{ $project: { code: 1, description: 1 } }] } },
        { $addFields: { acctCode: { $arrayElemAt: ["$acctCode", 0] } } },
        { $project: { createdAt: 0, updatedAt: 0, __v: 0, encodedBy: 0, acknowledgement: 0 } },
      ],
      as: "entries",
    },
  });

  pipelines.push({ $project: { createdAt: 0, updatedAt: 0, __v: 0, type: 0, encodedBy: 0 } });

  const transactions = await Acknowledgement.aggregate(pipelines).exec();

  return transactions;
};

exports.print_all_summary = async (docNoFrom, docNoTo) => {
  const filter = { deletedAt: null };
  if (docNoFrom || docNoTo) filter.$and = [];
  if (docNoFrom) filter.$and.push({ code: { $gte: docNoFrom } });
  if (docNoTo) filter.$and.push({ code: { $lte: docNoTo } });

  const transactions = await Acknowledgement.find(filter).populate({ path: "center" }).populate({ path: "bankCode" }).sort({ code: 1 });

  return transactions;
};

exports.print_summary_by_id = async transactionId => {
  const filter = { deletedAt: null, _id: transactionId };
  const transactions = await Acknowledgement.find(filter).populate({ path: "center" }).populate({ path: "bankCode" }).sort({ code: 1 });
  return transactions;
};
