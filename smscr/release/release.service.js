const CustomError = require("../../utils/custom-error.js");
const activityLogServ = require("../activity-logs/activity-log.service.js");
const Release = require("./release.schema.js");
const { default: mongoose } = require("mongoose");
const ReleaseEntry = require("./entries/release-entries.schema.js");
const { isAmountTally } = require("../../utils/tally-amount.js");
const SignatureParam = require("../system-parameters/signature-param.js");
const Transaction = require("../transactions/transaction.schema.js");
const Entry = require("../transactions/entries/entry.schema.js");
const PaymentSchedule = require("../payment-schedules/payment-schedule.schema.js");
const ChartOfAccount = require("../chart-of-account/chart-of-account.schema.js");
const { completeNumberDate } = require("../../utils/date.js");
const Bank = require("../banks/bank.schema.js");
const { loanTypeValues } = require("../../constants/loan-types.js");

exports.load_entries = async (dueDateId, type, category) => {
  const dueDate = await PaymentSchedule.findById(dueDateId).lean().exec();
  if (!dueDate) throw new CustomError("Payment Schedule not found", 400);

  const pipelines = [];

  pipelines.push({ $match: { _id: dueDate.loanRelease } });

  pipelines.push({
    $lookup: {
      from: "loans",
      let: { loanId: "$loan" },
      pipeline: [
        { $match: { $expr: { $eq: ["$_id", "$$loanId"] } } },
        {
          $lookup: {
            from: "loancodes",
            let: { loanCodeIds: "$loanCodes" },
            pipeline: [
              { $match: { $expr: { $in: ["$_id", "$$loanCodeIds"] } } },
              { $lookup: { from: "chartofaccounts", localField: "acctCode", foreignField: "_id", as: "acctCode" } },
              { $unwind: "$acctCode" },
            ],
            as: "loanCodes",
          },
        },
        {
          $project: {
            loanCodes: {
              $filter: {
                input: "$loanCodes",
                as: "code",
                cond: { $eq: ["$$code.module", "OR"], $eq: ["$$code.loanType", loanTypeValues[type]] },
              },
            },
          },
        },
        { $project: { loanCodes: { $sortArray: { input: "$loanCodes", sortBy: { sortOrder: 1 } } } } },
      ],
      as: "loan",
    },
  });

  pipelines.push({ $unwind: "$loan" });

  const [loanRelease, loanReleaseEntries] = await Promise.all([
    Transaction.aggregate(pipelines).exec(),
    Entry.find({ transaction: dueDate.loanRelease, client: { $ne: null } })
      .populate({ path: "client", select: "name" })
      .lean()
      .exec(),
  ]);

  const accountCodes = loanRelease[0].loan.loanCodes;

  const entries = loanReleaseEntries.reduce((acc, entry) => {
    const clientExists = acc.find(e => e.clientId === entry.client._id);
    if (!clientExists) {
      accountCodes.map(code => {
        if (category === "payments" && code.acctCode.code === "4045") return;
        acc.push({
          clientId: entry.client._id,
          clientName: entry.client.name,
          loanReleaseId: loanRelease[0]._id,
          cvNo: loanRelease[0].code,
          dueDate: completeNumberDate(dueDate.date),
          week: dueDate.week,
          acctCodeId: code.acctCode._id,
          acctCode: code.acctCode.code,
          acctCodeDesc: code.acctCode.description,
          debit: 0,
          credit: 0,
          type,
        });
      });
    }
    return acc;
  }, []);

  return { success: true, entries };
};

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

    const signature = await SignatureParam.findOne({ type: "acknowledgement receipt" }).lean().exec();

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
      preparedBy: author.username,
      checkedBy: signature.checkedBy,
      approvedBy: signature.approvedBy,
      receivedBy: signature.receivedBy,
      datePosted: new Date(),
    }).save({ session });

    if (!newRelease) {
      throw new CustomError("Failed to save acknowledgement receipt");
    }

    const entries = data.entries.map(entry => ({
      line: entry.line,
      release: newRelease._id,
      client: entry.clientId || null,
      loanReleaseId: entry.loanReleaseId || null,
      dueDate: entry.dueDate,
      acctCode: entry.acctCodeId,
      particular: entry.particular,
      debit: entry.debit,
      credit: entry.credit,
      week: entry?.week,
      encodedBy: author._id,
      type: loanTypeValues[entry.type],
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
        line: entry.line,
        release: updated._id,
        client: entry.clientId || null,
        loanReleaseId: entry.loanReleaseId || null,
        dueDate: entry.dueDate,
        acctCode: entry.acctCodeId,
        particular: entry.particular,
        debit: entry.debit,
        credit: entry.credit,
        encodedBy: author._id,
        week: entry?.week,
        type: loanTypeValues[entry.type],
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
              line: entry.line,
              client: entry.clientId || null,
              loanReleaseId: entry.loanReleaseId || null,
              dueDate: entry.dueDate,
              acctCode: entry.acctCodeId,
              particular: entry.particular,
              debit: entry.debit,
              credit: entry.credit,
              week: entry?.week,
              type: loanTypeValues[entry.type],
            },
          },
        },
      }));
      const updateds = await ReleaseEntry.bulkWrite(updates, { session });
      if (updateds.matchedCount !== updates.length) {
        throw new CustomError("Failed to update the acknowledgement receipt", 500);
      }
    }

    const latestEntries = await ReleaseEntry.find({ release: updated._id, deletedAt: null }).populate("acctCode").session(session).lean().exec();

    const { debitCreditBalanced, netDebitCreditBalanced, netAmountBalanced } = isAmountTally(latestEntries, updated.amount);

    if (!debitCreditBalanced) throw new CustomError("Debit and Credit must be balanced.", 400);
    if (!netDebitCreditBalanced) throw new CustomError("Please check all the amount in the entries", 400);
    if (!netAmountBalanced) throw new CustomError("Amount and Net Amount must be balanced", 400);

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

exports.print_by_date_summarized = async (dateFrom, dateTo) => {
  const filter = { deletedAt: null };

  if (dateFrom || dateTo) filter.$and = [];

  if (dateFrom && isValidDate(dateFrom)) {
    let fromDate = new Date(dateFrom);
    fromDate.setHours(0, 0, 0, 0);
    filter.$and.push({ date: { $gte: fromDate } });
  }

  if (dateTo && isValidDate(dateTo)) {
    let toDate = new Date(dateTo);
    toDate.setHours(23, 59, 59, 999);
    filter.$and.push({ date: { $lte: new Date(toDate) } });
  }

  const acknowledgements = await Release.find(filter).populate("center").lean().exec();

  return acknowledgements;
};

exports.print_by_date_account_officer = async (dateFrom, dateTo) => {
  const pipelines = [];
  const filter = { deletedAt: null };

  if (dateFrom || dateTo) filter.$and = [];

  if (dateFrom && isValidDate(dateFrom)) {
    let fromDate = new Date(dateFrom);
    fromDate.setHours(0, 0, 0, 0);
    filter.$and.push({ date: { $gte: fromDate } });
  }

  if (dateTo && isValidDate(dateTo)) {
    let toDate = new Date(dateTo);
    toDate.setHours(23, 59, 59, 999);
    filter.$and.push({ date: { $lte: new Date(toDate) } });
  }

  pipelines.push({ $match: filter });

  pipelines.push({ $lookup: { from: "centers", localField: "center", foreignField: "_id", as: "center" } });

  pipelines.push({ $lookup: { from: "banks", localField: "bankCode", foreignField: "_id", as: "bankCode" } });

  pipelines.push({ $unwind: "$center" });

  pipelines.push({ $unwind: "$bankCode" });

  pipelines.push({
    $lookup: {
      from: "releaseentries",
      let: { releaseId: "$_id" },
      pipeline: [
        { $match: { $expr: { $eq: ["$release", "$$releaseId"] } } },
        { $lookup: { from: "chartofaccounts", localField: "acctCode", foreignField: "_id", as: "acctCode" } },
      ],
      as: "entries",
    },
  });

  pipelines.push({ $group: { _id: "$acctOfficer", releases: { $push: "$$ROOT" } } });

  const acknowledgements = await Release.aggregate(pipelines).exec();

  return acknowledgements;
};

exports.print_by_accounts = async (accounts, dateFrom, dateTo) => {
  const pipelines = [];
  const entryFilter = { deletedAt: null };
  const accountsFilter = { deletedAt: null, _id: { $in: accounts } };

  if (dateFrom || dateTo) entryFilter.$and = [];

  if (dateFrom && isValidDate(dateFrom)) {
    let fromDate = new Date(dateFrom);
    fromDate.setHours(0, 0, 0, 0);
    entryFilter.$and.push({ "release.date": { $gte: fromDate } });
  }

  if (dateTo && isValidDate(dateTo)) {
    let toDate = new Date(dateTo);
    toDate.setHours(23, 59, 59, 999);
    entryFilter.$and.push({ "release.date": { $lte: new Date(toDate) } });
  }

  pipelines.push({ $match: accountsFilter });
  pipelines.push({ $sort: { code: 1 } });
  pipelines.push({
    $lookup: {
      from: "releaseentries",
      let: { acctCodeId: "$_id" },
      pipeline: [
        { $match: { $expr: { $eq: ["$acctCode", "$$acctCodeId"] } } },
        {
          $lookup: {
            from: "releases",
            let: { releaseId: "$release" },
            pipeline: [
              { $match: { $expr: { $eq: ["$_id", "$$releaseId"] } } },
              { $lookup: { from: "centers", localField: "center", foreignField: "_id", as: "center" } },
              { $unwind: "$center" },
            ],
            as: "release",
          },
        },
        { $lookup: { from: "customers", localField: "client", foreignField: "_id", as: "client" } },
        { $addFields: { release: { $arrayElemAt: ["$release", 0] }, client: { $arrayElemAt: ["$client", 0] } } },
        { $match: entryFilter },
        { $sort: { "release.date": 1 } },
      ],
      as: "entries",
    },
  });

  const acknowledgements = await ChartOfAccount.aggregate(pipelines).exec();

  return acknowledgements;
};

exports.print_all_by_bank = async bankIds => {
  const pipelines = [];

  pipelines.push({ $match: { deletedAt: null, _id: { $in: bankIds } } });

  pipelines.push({
    $lookup: {
      from: "releases",
      let: { bankId: "$_id" },
      pipeline: [
        { $match: { $expr: { $eq: ["$bankCode", "$$bankId"] } } },
        { $lookup: { from: "centers", localField: "center", foreignField: "_id", as: "center" } },
        { $unwind: "$center" },
      ],
      as: "releases",
    },
  });

  const banks = await Bank.aggregate(pipelines).exec();

  return banks;
};
