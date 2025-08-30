const DamayanFundEntry = require("./damayan-fund-entries.schema.js");
const DamayanFund = require("../damayan-fund.schema.js");
const activityLogServ = require("../../activity-logs/activity-log.service.js");
const CustomError = require("../../../utils/custom-error.js");

exports.get_all_no_pagination = async damayanFund => {
  const filter = { deletedAt: null, damayanFund };

  const entries = await DamayanFundEntry.find(filter)
    .sort("-createdAt")
    .populate({ path: "acctCode", select: "code description" })
    .populate({ path: "client", select: "name", populate: { path: "center", select: "centerNo" } })
    .lean()
    .exec();

  return {
    success: true,
    entries,
  };
};

exports.get_all = async (limit, page, offset, damayanFund) => {
  const filter = { deletedAt: null, damayanFund };

  const query = DamayanFundEntry.find(filter)
    .sort("-createdAt")
    .populate({ path: "acctCode", select: "code description" })
    .populate({ path: "client", select: "name", populate: { path: "center", select: "centerNo" } });

  const countPromise = DamayanFundEntry.countDocuments(filter);
  const entriesPromise = query.skip(offset).limit(limit).lean().exec();

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

exports.create = async (damayanFundId, data, author) => {
  const damayanFund = await DamayanFund.findById(damayanFundId).lean().exec();

  const newEntry = await new DamayanFundEntry({
    damayanFund: damayanFund._id,
    client: data.client || null,
    particular: data.particular || null,
    acctCode: data.acctCodeId,
    debit: data.debit,
    credit: data.credit,
    encodedBy: author._id,
  }).save();

  if (!newEntry) {
    throw new CustomError("Failed to create a new entry", 500);
  }

  await activityLogServ.create({
    author: author._id,
    username: author.username,
    activity: `created a damayan fund gl entries`,
    resource: `damayan fund - entry`,
    dataId: newEntry._id,
  });

  const entry = await DamayanFundEntry.findById(newEntry._id)
    .populate({ path: "acctCode", select: "code description" })
    .populate({ path: "client", select: "name", populate: { path: "center", select: "centerNo" } })
    .lean()
    .exec();

  return {
    success: true,
    entry,
  };
};

exports.update = async (damayanFundId, entryId, data, author) => {
  const updated = await DamayanFundEntry.findOneAndUpdate(
    { _id: entryId, damayanFund: damayanFundId },
    {
      $set: {
        client: data.client || null,
        particular: data.particular || null,
        acctCode: data.acctCodeId,
        debit: data.debit,
        credit: data.credit,
      },
    },
    { new: true }
  )
    .populate({ path: "acctCode", select: "code description" })
    .populate({ path: "client", select: "name", populate: { path: "center", select: "centerNo" } })
    .lean()
    .exec();

  if (!updated) {
    throw new CustomError("Failed to update the entry", 500);
  }

  await activityLogServ.create({
    author: author._id,
    username: author.username,
    activity: `updated a damayan fund gl entries`,
    resource: `damayan fund - entry`,
    dataId: updated._id,
  });

  return {
    success: true,
    entry: updated,
  };
};

exports.delete = async (filter, author) => {
  const deletedEntry = await DamayanFundEntry.findOneAndUpdate(filter, { $set: { deletedAt: new Date().toISOString() } }).exec();
  if (!deletedEntry) {
    throw new CustomError("Failed to delete the entry", 500);
  }

  await activityLogServ.create({
    author: author._id,
    username: author.username,
    activity: `deleted a gl entry in damayan fund`,
    resource: `damayan fund - entry`,
    dataId: deletedEntry._id,
  });

  return { success: true, entry: filter._id };
};
