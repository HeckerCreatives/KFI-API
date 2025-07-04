const EmergencyLoanEntry = require("./emergency-loan-entry.schema.js");
const EmergencyLoan = require("../emergency-loan.schema.js");
const activityLogServ = require("../../activity-logs/activity-log.service.js");

exports.get_all = async (limit, page, offset, emergencyLoan) => {
  const filter = { deletedAt: null, emergencyLoan };

  const query = EmergencyLoanEntry.find(filter)
    .sort("-createdAt")
    .populate({ path: "acctCode", select: "code description" })
    .populate({ path: "client", select: "name", populate: { path: "center", select: "centerNo" } });

  const countPromise = EmergencyLoanEntry.countDocuments(filter);
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

exports.create = async (emergencyLoanId, data, author) => {
  const emergencyLoan = await EmergencyLoan.findById(emergencyLoanId).lean().exec();

  const newEntry = await new EmergencyLoanEntry({
    emergencyLoan: emergencyLoan._id,
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
    activity: `created a emergency loan gl entries`,
    resource: `emergency loan - entry`,
    dataId: newEntry._id,
  });

  const entry = await EmergencyLoanEntry.findById(newEntry._id)
    .populate({ path: "acctCode", select: "code description" })
    .populate({ path: "client", select: "name", populate: { path: "center", select: "centerNo" } })
    .lean()
    .exec();

  return {
    success: true,
    entry,
  };
};

exports.update = async (emergencyLoanId, entryId, data, author) => {
  const updated = await EmergencyLoanEntry.findOneAndUpdate(
    { _id: entryId, emergencyLoan: emergencyLoanId },
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
    activity: `updated a emergency loan gl entries`,
    resource: `emergency loan - entry`,
    dataId: updated._id,
  });

  return {
    success: true,
    entry: updated,
  };
};

exports.delete = async (filter, author) => {
  const deletedEntry = await EmergencyLoanEntry.findOneAndUpdate(filter, { $set: { deletedAt: new Date().toISOString() } }).exec();
  if (!deletedEntry) {
    throw new CustomError("Failed to delete the entry", 500);
  }

  await activityLogServ.create({
    author: author._id,
    username: author.username,
    activity: `deleted a gl entry in emergency loan`,
    resource: `emergency loan - entry`,
    dataId: deletedEntry._id,
  });

  return { success: true, entry: filter._id };
};
