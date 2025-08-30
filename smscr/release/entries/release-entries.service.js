const Release = require("../release.schema.js");
const ReleaseEntry = require("./release-entries.schema.js");
const activityLogServ = require("../../activity-logs/activity-log.service.js");

exports.get_all_no_pagination = async release => {
  const filter = { deletedAt: null, release };

  const entries = await ReleaseEntry.find(filter)
    .sort("-createdAt")
    .populate({ path: "acctCode", select: "code description" })
    .populate({
      path: "loanReleaseEntryId",
      select: "client center transaction",
      populate: [
        { path: "client", select: "name" },
        { path: "center", select: "" },
        { path: "transaction", select: "code noOfWeeks dueDate" },
      ],
    })
    .lean()
    .exec();

  return {
    success: true,
    entries,
  };
};

exports.get_all = async (limit, page, offset, release) => {
  const filter = { deletedAt: null, release };

  const query = ReleaseEntry.find(filter)
    .sort("-createdAt")
    .populate({ path: "acctCode", select: "code description" })
    .populate({
      path: "loanReleaseEntryId",
      select: "client center transaction",
      populate: [
        { path: "client", select: "name" },
        { path: "center", select: "" },
        { path: "transaction", select: "code noOfWeeks dueDate" },
      ],
    })
    .skip(offset)
    .limit(limit);

  const countPromise = ReleaseEntry.countDocuments(filter);
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

exports.create = async (releaseId, data, author) => {
  const release = await Release.findById(releaseId).lean().exec();

  const newEntry = await new ReleaseEntry({
    release: release._id,
    loanReleaseEntryId: data.loanReleaseEntryId || null,
    acctCode: data.acctCodeId,
    particular: data.particular,
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
    activity: `created a release gl entries`,
    resource: `release - entry`,
    dataId: newEntry._id,
  });

  const entry = await ReleaseEntry.findById(newEntry._id).populate({ path: "acctCode", select: "code description" }).lean().exec();

  return {
    success: true,
    entry,
  };
};

exports.update = async (releaseId, entryId, data, author) => {
  const updated = await ReleaseEntry.findOneAndUpdate(
    { _id: entryId, release: releaseId },
    {
      $set: {
        loanReleaseEntryId: data.loanReleaseEntryId || null,
        acctCode: data.acctCodeId,
        particular: data.particular,
        debit: data.debit,
        credit: data.credit,
        encodedBy: author._id,
      },
    },
    { new: true }
  )
    .populate({ path: "acctCode", select: "code description" })
    .populate({
      path: "loanReleaseEntryId",
      select: "client center transaction",
      populate: [
        { path: "client", select: "name" },
        { path: "center", select: "" },
        { path: "transaction", select: "code noOfWeeks dueDate" },
      ],
    })
    .lean()
    .exec();

  if (!updated) {
    throw new CustomError("Failed to update the entry", 500);
  }

  await activityLogServ.create({
    author: author._id,
    username: author.username,
    activity: `updated a release gl entries`,
    resource: `release - entry`,
    dataId: updated._id,
  });

  return {
    success: true,
    entry: updated,
  };
};

exports.delete = async (filter, author) => {
  const deletedEntry = await ReleaseEntry.findOneAndUpdate(filter, { $set: { deletedAt: new Date().toISOString() } }).exec();
  if (!deletedEntry) {
    throw new CustomError("Failed to delete the entry", 500);
  }

  await activityLogServ.create({
    author: author._id,
    username: author.username,
    activity: `deleted a gl entry in release`,
    resource: `release - entry`,
    dataId: deletedEntry._id,
  });

  return { success: true, entry: filter._id };
};
