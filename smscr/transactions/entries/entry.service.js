const CustomError = require("../../../utils/custom-error.js");
const Entry = require("./entry.schema.js");
const activityLogServ = require("../../activity-logs/activity-log.service.js");
const Transaction = require("../transaction.schema.js");
const { default: mongoose } = require("mongoose");

exports.loan_entries = async center => {
  const filter = {
    deletedAt: null,
    center: new mongoose.Types.ObjectId(center),
    $or: [{ "transaction.status": "open" }, { "transaction.status": "past due" }],
    "transaction.deletedAt": null,
  };
  const pipelines = [];
  pipelines.push({ $lookup: { from: "transactions", localField: "transaction", foreignField: "_id", as: "transaction" } });
  pipelines.push({ $addFields: { transaction: { $arrayElemAt: ["$transaction", 0] } } });
  pipelines.push({ $match: filter });
  pipelines.push({ $lookup: { from: "customers", localField: "client", foreignField: "_id", as: "client" } });
  pipelines.push({ $lookup: { from: "centers", localField: "center", foreignField: "_id", as: "center" } });
  pipelines.push({ $addFields: { center: { $arrayElemAt: ["$center", 0] }, client: { $arrayElemAt: ["$client", 0] } } });
  pipelines.push({
    $project: { _id: 1, cvNo: "$transaction.code", dueDate: "$transaction.dueDate", noOfWeeks: "$transaction.noOfWeeks", name: "$client.name", centerNo: "$center.centerNo" },
  });

  const entries = await Entry.aggregate(pipelines).exec();

  return {
    success: true,
    entries,
  };
};

exports.get_selections = async (keyword, limit, page, offset) => {
  const filter = { deletedAt: null, $or: [{ "transaction.code": new RegExp(keyword, "i") }, { "client.name": new RegExp(keyword, "i") }] };

  const pipelines = [];

  pipelines.push({ $lookup: { from: "transactions", localField: "transaction", foreignField: "_id", as: "transaction" } });
  pipelines.push({ $lookup: { from: "customers", localField: "client", foreignField: "_id", as: "client" } });
  pipelines.push({ $addFields: { transaction: { $arrayElemAt: ["$transaction", 0] }, client: { $arrayElemAt: ["$client", 0] } } });
  pipelines.push({ $match: filter });

  const countPromise = Entry.aggregate([...pipelines, { $count: "count" }]);

  pipelines.push({ $skip: offset });
  pipelines.push({ $limit: limit });
  pipelines.push({ $project: { _id: 1, cvNo: "$transaction.code", dueDate: "$transaction.dueDate", noOfWeeks: "$transaction.noOfWeeks", name: "$client.name" } });
  const loanEntriesPromise = Entry.aggregate(pipelines).exec();

  const [count, loanEntries] = await Promise.all([countPromise, loanEntriesPromise]);

  let newCount = count && count.length > 0 ? count[0].count : 0;

  const hasNextPage = newCount > offset + limit;
  const hasPrevPage = page > 1;
  const totalPages = Math.ceil(newCount / limit);

  return {
    success: true,
    loanEntries,
    hasNextPage,
    hasPrevPage,
    totalPages,
  };
};

exports.get_all_no_pagination = async transaction => {
  const filter = { deletedAt: null, transaction };

  const entries = await Entry.find(filter)
    .sort("-line")
    .populate({ path: "acctCode", select: "code description" })
    .populate({ path: "center", select: "centerNo description" })
    .populate({ path: "client", select: "name" })
    .populate({ path: "product", select: "code" });

  return {
    success: true,
    entries,
  };
};

exports.get_all = async (limit, page, offset, transaction) => {
  const filter = { deletedAt: null, transaction };

  const query = Entry.find(filter)
    .sort("line")
    .populate({ path: "acctCode", select: "code description" })
    .populate({ path: "center", select: "centerNo description" })
    .populate({ path: "client", select: "name" })
    .populate({ path: "product", select: "code" });

  const countPromise = Entry.countDocuments(filter);
  const entriesPromise = query.skip(offset).limit(limit).exec();

  const [count, entries] = await Promise.all([countPromise, entriesPromise]);

  const hasNextPage = count > offset + limit;
  const hasPrevPage = page > 1;
  const totalPages = Math.ceil(count / limit);

  return {
    success: true,
    entries,
    hasNextPage,
    hasPrevPage,
    totalPages,
  };
};

exports.create = async (transactionId, data, author) => {
  const transaction = await Transaction.findById(transactionId).lean().exec();

  const newEntry = await new Entry({
    transaction: transactionId,
    client: data.clientId || null,
    product: transaction.loan,
    center: transaction.center,
    acctCode: data.acctCodeId || null,
    particular: data.particular,
    debit: data.debit,
    credit: data.credit,
    interest: data.interest,
    cycle: data.cycle,
    checkNo: data.checkNo,
    encodedBy: author._id,
  }).save();

  if (!newEntry) {
    throw new CustomError("Failed to create a new entry", 500);
  }

  const entry = await Entry.findById(newEntry._id)
    .populate({ path: "acctCode", select: "code description" })
    .populate({ path: "center", select: "centerNo description" })
    .populate({ path: "client", select: "name" })
    .populate({ path: "product", select: "code" })
    .lean()
    .exec();

  await activityLogServ.create({
    author: author._id,
    username: author.username,
    activity: `created a loan release gl entries`,
    resource: `loan release - entry`,
    dataId: newEntry._id,
  });

  return {
    success: true,
    entry,
  };
};

exports.update = async (transactionId, entryId, data, author) => {
  const updated = await Entry.findOneAndUpdate(
    { _id: entryId, transaction: transactionId },
    {
      $set: {
        client: data.clientId || null,
        product: data.typeOfLoan,
        acctCode: data.acctCodeId || null,
        particular: data.particular,
        debit: data.debit,
        credit: data.credit,
        interest: data.interest,
        cycle: data.cycle,
        checkNo: data.checkNo,
      },
    },
    { new: true }
  )
    .populate({ path: "acctCode", select: "code description" })
    .populate({ path: "center", select: "centerNo description" })
    .populate({ path: "client", select: "name" })
    .populate({ path: "product", select: "code" })
    .lean()
    .exec();

  if (!updated) {
    throw new CustomError("Failed to update the entry", 500);
  }

  await activityLogServ.create({
    author: author._id,
    username: author.username,
    activity: `updated a loan release gl entries`,
    resource: `loan release - entry`,
    dataId: updated._id,
  });

  return {
    success: true,
    entry: updated,
  };
};

exports.delete = async (filter, author) => {
  const deletedEntry = await Entry.findOneAndUpdate(filter, { $set: { deletedAt: new Date().toISOString() } }).exec();
  if (!deletedEntry) {
    throw new CustomError("Failed to delete the entry", 500);
  }

  await activityLogServ.create({
    author: author._id,
    username: author.username,
    activity: `deleted a gl entry in loan release`,
    resource: `loan release - entry`,
    dataId: deletedEntry._id,
  });

  return { success: true, entry: filter._id };
};
