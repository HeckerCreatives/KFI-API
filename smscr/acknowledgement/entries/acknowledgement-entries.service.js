const Acknowledgement = require("../acknowlegement.schema.js");
const AcknowledgementEntry = require("./acknowledgement-entries.schema.js");
const activityLogServ = require("../../activity-logs/activity-log.service.js");

exports.get_all_no_pagination = async acknowledgement => {
  const filter = { deletedAt: null, acknowledgement };

  const entries = await AcknowledgementEntry.find(filter)
    .sort("line")
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

exports.get_all = async (limit, page, offset, acknowledgement) => {
  const filter = { deletedAt: null, acknowledgement };

  const query = AcknowledgementEntry.find(filter)
    .sort("line")
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

  const countPromise = AcknowledgementEntry.countDocuments(filter);
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

exports.create = async (acknowledgementId, data, author) => {
  const acknowledgement = await Acknowledgement.findById(acknowledgementId).lean().exec();

  const newEntry = await new AcknowledgementEntry({
    acknowledgement: acknowledgement._id,
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
    activity: `created a acknowledgement gl entries`,
    resource: `acknowledgement - entry`,
    dataId: newEntry._id,
  });

  const entry = await AcknowledgementEntry.findById(newEntry._id).populate({ path: "acctCode", select: "code description" }).lean().exec();

  return {
    success: true,
    entry,
  };
};

exports.update = async (acknowledgementId, entryId, data, author) => {
  const updated = await AcknowledgementEntry.findOneAndUpdate(
    { _id: entryId, acknowledgement: acknowledgementId },
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
    activity: `updated a acknowledgement gl entries`,
    resource: `acknowledgement - entry`,
    dataId: updated._id,
  });

  return {
    success: true,
    entry: updated,
  };
};

exports.delete = async (filter, author) => {
  const deletedEntry = await AcknowledgementEntry.findOneAndUpdate(filter, { $set: { deletedAt: new Date().toISOString() } }).exec();
  if (!deletedEntry) {
    throw new CustomError("Failed to delete the entry", 500);
  }

  await activityLogServ.create({
    author: author._id,
    username: author.username,
    activity: `deleted a gl entry in acknowledgement`,
    resource: `acknowledgement - entry`,
    dataId: deletedEntry._id,
  });

  return { success: true, entry: filter._id };
};
