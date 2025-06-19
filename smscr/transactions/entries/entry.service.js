const CustomError = require("../../../utils/custom-error.js");
const Entry = require("./entry.schema.js");
const activityLogServ = require("../../activity-logs/activity-log.service.js");
const Transaction = require("../transaction.schema.js");

exports.get_all = async (limit, page, offset, transaction) => {
  const filter = { deletedAt: null, transaction };

  const query = Entry.find(filter)
    .sort("-createdAt")
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
        acctCode: data.acctCodeId,
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
