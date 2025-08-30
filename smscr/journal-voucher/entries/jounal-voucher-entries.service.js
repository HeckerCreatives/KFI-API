const JournalVoucher = require("../journal-voucher.schema.js");
const JournalVoucherEntry = require("./journal-voucher-entries.schema.js");
const activityLogServ = require("../../activity-logs/activity-log.service.js");

exports.get_all_no_pagination = async journalVoucher => {
  const filter = { deletedAt: null, journalVoucher };

  const entries = await JournalVoucherEntry.find(filter)
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

exports.get_all = async (limit, page, offset, journalVoucher) => {
  const filter = { deletedAt: null, journalVoucher };

  const query = JournalVoucherEntry.find(filter)
    .sort("-createdAt")
    .populate({ path: "acctCode", select: "code description" })
    .populate({ path: "client", select: "name", populate: { path: "center", select: "centerNo" } });

  const countPromise = JournalVoucherEntry.countDocuments(filter);
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

exports.create = async (journalVoucherId, data, author) => {
  const journalVoucher = await JournalVoucher.findById(journalVoucherId).lean().exec();

  const newEntry = await new JournalVoucherEntry({
    journalVoucher: journalVoucher._id,
    client: data.client || null,
    acctCode: data.acctCodeId,
    particular: data.particular || null,
    debit: data.debit,
    credit: data.credit,
    cvForRecompute: data.cvForRecompute,
    encodedBy: author._id,
  }).save();

  if (!newEntry) {
    throw new CustomError("Failed to create a new entry", 500);
  }

  await activityLogServ.create({
    author: author._id,
    username: author.username,
    activity: `created a journal voucher gl entries`,
    resource: `journal voucher - entry`,
    dataId: newEntry._id,
  });

  const entry = await JournalVoucherEntry.findById(newEntry._id).populate({ path: "acctCode", select: "code description" }).lean().exec();

  return {
    success: true,
    entry,
  };
};

exports.update = async (journalVoucherId, entryId, data, author) => {
  const updated = await JournalVoucherEntry.findOneAndUpdate(
    { _id: entryId, journalVoucher: journalVoucherId },
    {
      $set: {
        acctCode: data.acctCodeId,
        client: data.client || null,
        particular: data.particular || null,
        debit: data.debit,
        credit: data.credit,
        cvForRecompute: data.cvForRecompute,
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
    activity: `updated a journal voucher gl entries`,
    resource: `journal voucher - entry`,
    dataId: updated._id,
  });

  return {
    success: true,
    entry: updated,
  };
};

exports.delete = async (filter, author) => {
  const deletedEntry = await JournalVoucherEntry.findOneAndUpdate(filter, { $set: { deletedAt: new Date().toISOString() } }).exec();
  if (!deletedEntry) {
    throw new CustomError("Failed to delete the entry", 500);
  }

  await activityLogServ.create({
    author: author._id,
    username: author.username,
    activity: `deleted a gl entry in journal voucher`,
    resource: `journal voucher - entry`,
    dataId: deletedEntry._id,
  });

  return { success: true, entry: filter._id };
};
