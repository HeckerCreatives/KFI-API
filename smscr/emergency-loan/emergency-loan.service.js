const CustomError = require("../../utils/custom-error.js");
const EmergencyLoan = require("./emergency-loan.schema.js");
const EmergencyLoanEntry = require("./entries/emergency-loan-entry.schema.js");
const activityLogServ = require("../activity-logs/activity-log.service.js");
const mongoose = require("mongoose");
const Customer = require("../customer/customer.schema.js");
const { isAmountTally } = require("../../utils/tally-amount.js");
const SignatureParam = require("../system-parameters/signature-param.js");
const { isValidDate } = require("../../utils/date.js");
const ChartOfAccount = require("../chart-of-account/chart-of-account.schema.js");

exports.get_selections = async (keyword, limit, page, offset) => {
  const filter = { deletedAt: null, code: new RegExp(keyword, "i") };

  const emergencyLoansPromise = EmergencyLoan.find(filter, { code: 1 }).skip(offset).limit(limit).lean().exec();
  const countPromise = EmergencyLoan.countDocuments(filter);

  const [count, emergencyLoans] = await Promise.all([countPromise, emergencyLoansPromise]);

  const hasNextPage = count > offset + limit;
  const hasPrevPage = page > 1;
  const totalPages = Math.ceil(count / limit);

  return {
    success: true,
    emergencyLoans,
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

  const query = EmergencyLoan.find(filter);
  if (sort && ["code-asc", "code-desc"].includes(sort)) query.sort({ code: sort === "code-asc" ? 1 : -1 });
  else query.sort({ createdAt: -1 });

  const countPromise = EmergencyLoan.countDocuments(filter);
  const emergencyLoansPromise = query
    .populate({ path: "bankCode", select: "code description" })
    .populate({ path: "client", select: "name" })
    .populate({ path: "encodedBy", select: "-_id username" })
    .skip(offset)
    .limit(limit)
    .exec();

  const [count, emergencyLoans] = await Promise.all([countPromise, emergencyLoansPromise]);

  const hasNextPage = count > offset + limit;
  const hasPrevPage = page > 1;
  const totalPages = Math.ceil(count / limit);

  return {
    success: true,
    emergencyLoans,
    hasNextPage,
    hasPrevPage,
    totalPages,
  };
};

exports.get_single = async filter => {
  const emergencyLoan = await EmergencyLoan.findOne(filter).exec();
  if (!emergencyLoan) {
    throw new CustomError("Emergency loan not found", 404);
  }
  return { success: true, emergencyLoan };
};

exports.create = async (data, author) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const signature = await SignatureParam.findOne({ type: "emergency loan" }).lean().exec();
    const newEmergencyLoan = await new EmergencyLoan({
      code: data.code.toUpperCase(),
      client: data.clientValue,
      refNo: data.refNo,
      remarks: data.remarks,
      date: data.date,
      acctMonth: data.acctMonth,
      acctYear: data.acctYear,
      checkNo: data.checkNo,
      checkDate: data.checkDate,
      bankCode: data.bankCode,
      amount: data.amount,
      encodedBy: author._id,
      preparedBy: author.username,
      checkedBy: signature.checkedBy,
      approvedBy: signature.approvedBy,
      receivedBy: signature.receivedBy,
    }).save({ session });

    if (!newEmergencyLoan) {
      throw new CustomError("Failed to create a new emergency loan", 500);
    }

    const entries = data.entries.map(entry => ({
      line: entry.line,
      emergencyLoan: newEmergencyLoan._id,
      client: entry.client || null,
      particular: entry.particular || null,
      acctCode: entry.acctCodeId,
      debit: entry.debit,
      credit: entry.credit,
    }));

    const newEntries = await EmergencyLoanEntry.insertMany(entries, { session });

    if (newEntries.length !== entries.length) {
      throw new CustomError("Failed to create an emergency loan");
    }

    const _ids = newEntries.map(entry => entry._id);

    const currentEntries = await EmergencyLoanEntry.find({ _id: { $in: _ids }, client: { $ne: null } })
      .populate("acctCode")
      .session(session)
      .lean()
      .exec();

    const emergencyLoan = await EmergencyLoan.findById(newEmergencyLoan._id)
      .populate({ path: "bankCode", select: "code description" })
      .populate({ path: "client", select: "name" })
      .populate({ path: "encodedBy", select: "-_id username" })
      .session(session)
      .exec();

    await activityLogServ.create({
      author: author._id,
      username: author.username,
      activity: `created an emergency loan`,
      resource: `emergency loan`,
      dataId: emergencyLoan._id,
      session,
    });

    await Promise.all(
      _ids.map(async id => {
        await activityLogServ.create({
          author: author._id,
          username: author.username,
          activity: `created a emergency loan entry`,
          resource: `emergency loan - entry`,
          dataId: id,
          session,
        });
      })
    );

    await session.commitTransaction();

    return {
      success: true,
      emergencyLoan,
    };
  } catch (error) {
    await session.abortTransaction();
    throw new CustomError(error.message || "Failed to create an emergency loan", error.statusCode || 500);
  } finally {
    await session.endSession();
  }
};

exports.update = async (filter, data, author) => {
  const entryToUpdate = data.entries.filter(entry => entry._id);
  const entryToCreate = data.entries.filter(entry => !entry._id);

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const updatedEmergencyLoan = await EmergencyLoan.findOneAndUpdate(
      filter,
      {
        $set: {
          code: data.code.toUpperCase(),
          client: data.clientValue,
          refNo: data.refNo,
          remarks: data.remarks,
          date: data.date,
          acctMonth: data.acctMonth,
          acctYear: data.acctYear,
          checkNo: data.checkNo,
          checkDate: data.checkDate,
          bankCode: data.bankCode,
          amount: data.amount,
        },
      },
      { new: true }
    )
      .populate({ path: "bankCode", select: "code description" })
      .populate({ path: "client", select: "name" })
      .populate({ path: "encodedBy", select: "-_id username" })
      .exec();

    if (!updatedEmergencyLoan) {
      throw new CustomError("Failed to update the emergency loan", 500);
    }

    if (entryToCreate.length > 0) {
      const newEntries = entryToCreate.map(entry => ({
        line: entry.line,
        emergencyLoan: updatedEmergencyLoan._id,
        client: entry.client || null,
        particular: entry.particular || null,
        acctCode: entry.acctCodeId,
        debit: entry.debit,
        credit: entry.credit,
        encodedBy: author._id,
      }));

      const added = await EmergencyLoanEntry.insertMany(newEntries, { session });
      if (added.length !== newEntries.length) {
        throw new CustomError("Failed to update the emergency loan", 500);
      }
    }

    if (data.deletedIds && data.deletedIds.length > 0) {
      const deleted = await EmergencyLoanEntry.updateMany(
        { _id: { $in: data.deletedIds }, deletedAt: { $exists: false } },
        { deletedAt: new Date().toISOString() },
        { session }
      ).exec();
      if (deleted.matchedCount !== data.deletedIds.length) {
        throw new CustomError("Failed to update the emergency loan", 500);
      }
    }

    if (entryToUpdate.length > 0) {
      const updates = entryToUpdate.map(entry => ({
        updateOne: {
          filter: { _id: entry._id },
          update: {
            $set: {
              line: entry.line,
              client: entry.client || null,
              particular: entry.particular || null,
              acctCode: entry.acctCodeId,
              debit: entry.debit,
              credit: entry.credit,
            },
          },
        },
      }));
      const updated = await EmergencyLoanEntry.bulkWrite(updates, { session });
      if (updated.matchedCount !== updates.length) {
        throw new CustomError("Failed to update the emergency loan", 500);
      }
    }

    const latestEntries = await EmergencyLoanEntry.find({ emergencyLoan: updatedEmergencyLoan._id, deletedAt: null }).populate("acctCode").session(session).lean().exec();

    const { debitCreditBalanced, netDebitCreditBalanced, netAmountBalanced } = isAmountTally(latestEntries, updatedEmergencyLoan.amount);
    if (!debitCreditBalanced) throw new CustomError("Debit and Credit must be balanced.", 400);
    if (!netDebitCreditBalanced) throw new CustomError("Please check all the amount in the entries", 400);
    if (!netAmountBalanced) throw new CustomError("Amount and Net Amount must be balanced", 400);

    await activityLogServ.create({
      author: author._id,
      username: author.username,
      activity: `updated an emergency loan`,
      resource: `emergency loan`,
      dataId: updatedEmergencyLoan._id,
      session,
    });

    await session.commitTransaction();

    return {
      success: true,
      emergencyLoan: updatedEmergencyLoan,
    };
  } catch (error) {
    await session.abortTransaction();
    throw new CustomError(error.message || "Failed to update emergency loan", error.statusCode || 500);
  } finally {
    await session.endSession();
  }
};

exports.delete = async (filter, author) => {
  const deleted = await EmergencyLoan.findOneAndUpdate(filter, { $set: { deletedAt: new Date().toISOString() } }).exec();
  if (!deleted) throw new CustomError("Failed to delete the expense voucher", 500);

  await EmergencyLoanEntry.updateMany({ emergencyLoan: deleted._id }, { $set: { deletedAt: new Date().toISOString() } }).exec();

  await activityLogServ.create({
    author: author._id,
    username: author.username,
    activity: `deleted an emergency loan along with its linked gl entries`,
    resource: `emergency loan`,
    dataId: deleted._id,
  });

  return { success: true, emergencyLoan: filter._id };
};

exports.print_all_detailed = async (docNoFrom, docNoTo) => {
  const pipelines = [];
  const filter = { deletedAt: null };
  if (docNoFrom || docNoTo) filter.$and = [];
  if (docNoFrom) filter.$and.push({ code: { $gte: docNoFrom } });
  if (docNoTo) filter.$and.push({ code: { $lte: docNoTo } });

  pipelines.push({ $match: filter });

  pipelines.push({ $sort: { code: 1 } });

  pipelines.push({ $lookup: { from: "banks", localField: "bankCode", foreignField: "_id", as: "bankCode", pipeline: [{ $project: { code: 1, description: 1 } }] } });

  pipelines.push({ $lookup: { from: "customers", localField: "client", foreignField: "_id", as: "client", pipeline: [{ $project: { name: 1 } }] } });

  pipelines.push({ $addFields: { bankCode: { $arrayElemAt: ["$bankCode", 0] }, client: { $arrayElemAt: ["$client", 0] } } });

  pipelines.push({
    $lookup: {
      from: "emergencyloanentries",
      let: { localField: "$_id" },
      pipeline: [
        { $match: { $expr: { $eq: ["$$localField", "$emergencyLoan"] }, deletedAt: null } },
        { $lookup: { from: "chartofaccounts", localField: "acctCode", foreignField: "_id", as: "acctCode", pipeline: [{ $project: { code: 1, description: 1 } }] } },
        {
          $lookup: {
            from: "customers",
            localField: "client",
            foreignField: "_id",
            as: "client",
            pipeline: [{ $project: { name: 1, center: 1 } }, { $lookup: { from: "centers", localField: "center", foreignField: "_id", as: "center" } }],
          },
        },
        { $addFields: { acctCode: { $arrayElemAt: ["$acctCode", 0] } } },
        { $project: { createdAt: 0, updatedAt: 0, __v: 0, encodedBy: 0, expenseVoucher: 0 } },
      ],
      as: "entries",
    },
  });

  pipelines.push({ $project: { createdAt: 0, updatedAt: 0, __v: 0, type: 0, encodedBy: 0 } });

  const emergencyLoans = await EmergencyLoan.aggregate(pipelines).exec();

  return emergencyLoans;
};

exports.print_detailed_by_id = async emergencyLoanId => {
  const pipelines = [];
  const filter = { deletedAt: null, _id: new mongoose.Types.ObjectId(emergencyLoanId) };

  pipelines.push({ $match: filter });

  pipelines.push({ $sort: { code: 1 } });

  pipelines.push({ $lookup: { from: "banks", localField: "bankCode", foreignField: "_id", as: "bankCode", pipeline: [{ $project: { code: 1, description: 1 } }] } });

  pipelines.push({ $lookup: { from: "customers", localField: "client", foreignField: "_id", as: "client", pipeline: [{ $project: { name: 1 } }] } });

  pipelines.push({ $addFields: { bankCode: { $arrayElemAt: ["$bankCode", 0] }, client: { $arrayElemAt: ["$client", 0] } } });

  pipelines.push({
    $lookup: {
      from: "emergencyloanentries",
      let: { localField: "$_id" },
      pipeline: [
        { $match: { $expr: { $eq: ["$$localField", "$emergencyLoan"] }, deletedAt: null } },
        { $lookup: { from: "chartofaccounts", localField: "acctCode", foreignField: "_id", as: "acctCode", pipeline: [{ $project: { code: 1, description: 1 } }] } },
        {
          $lookup: {
            from: "customers",
            localField: "client",
            foreignField: "_id",
            as: "client",
            pipeline: [{ $project: { name: 1, center: 1 } }, { $lookup: { from: "centers", localField: "center", foreignField: "_id", as: "center" } }],
          },
        },
        { $addFields: { acctCode: { $arrayElemAt: ["$acctCode", 0] } } },
        { $project: { createdAt: 0, updatedAt: 0, __v: 0, encodedBy: 0, expenseVoucher: 0 } },
      ],
      as: "entries",
    },
  });

  pipelines.push({ $project: { createdAt: 0, updatedAt: 0, __v: 0, type: 0, encodedBy: 0 } });

  const emergencyLoans = await EmergencyLoan.aggregate(pipelines).exec();

  return emergencyLoans;
};

exports.print_all_summary = async (docNoFrom, docNoTo) => {
  const filter = { deletedAt: null };
  if (docNoFrom || docNoTo) filter.$and = [];
  if (docNoFrom) filter.$and.push({ code: { $gte: docNoFrom } });
  if (docNoTo) filter.$and.push({ code: { $lte: docNoTo } });
  const emergencyLoans = await EmergencyLoan.find(filter).populate({ path: "bankCode" }).populate({ path: "client" }).sort({ code: 1 });
  return emergencyLoans;
};

exports.print_summary_by_id = async emergencyLoanId => {
  const filter = { deletedAt: null, _id: emergencyLoanId };
  const emergencyLoans = await EmergencyLoan.find(filter).populate({ path: "bankCode" }).populate({ path: "client" }).sort({ code: 1 });
  return emergencyLoans;
};

exports.print_file = async id => {
  const emergency = await EmergencyLoan.findOne({ _id: id, deletedAt: null }).populate("client").populate("bankCode").lean().exec();
  const entries = await EmergencyLoanEntry.find({ emergencyLoan: emergency._id, deletedAt: null }).sort({ line: 1 }).populate("client").populate("acctCode").lean().exec();
  let payTo = `${emergency?.client?.name || ""}`;

  const uniqueClientIds = [];
  entries.map(entry => {
    if (entry?.client?._id && !uniqueClientIds.includes(`${entry.client._id}`)) uniqueClientIds.push(`${entry.client._id}`);
  });

  if (uniqueClientIds.length < 2 && uniqueClientIds.length !== 0) {
    const client = await Customer.findById({ _id: uniqueClientIds[0] }).lean().exec();
    payTo = `${client.name}`;
  }

  return {
    success: true,
    emergency,
    entries,
    payTo,
  };
};

exports.print_detailed_by_date = async (dateFrom, dateTo) => {
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

  pipelines.push({ $sort: { date: 1 } });

  pipelines.push({ $lookup: { from: "banks", localField: "bankCode", foreignField: "_id", as: "bank", pipeline: [{ $project: { code: 1, description: 1 } }] } });

  pipelines.push({ $addFields: { bank: { $arrayElemAt: ["$bank", 0] } } });

  pipelines.push({
    $lookup: {
      from: "emergencyloanentries",
      let: { localField: "$_id" },
      pipeline: [
        { $match: { $expr: { $eq: ["$$localField", "$emergencyLoan"] }, deletedAt: null } },
        { $lookup: { from: "chartofaccounts", localField: "acctCode", foreignField: "_id", as: "acctCode", pipeline: [{ $project: { code: 1, description: 1 } }] } },
        {
          $lookup: {
            from: "customers",
            localField: "client",
            foreignField: "_id",
            as: "client",
            pipeline: [{ $lookup: { from: "centers", localField: "center", foreignField: "_id", as: "center" } }, { $addFields: { center: { $arrayElemAt: ["$center", 0] } } }],
          },
        },
        { $addFields: { acctCode: { $arrayElemAt: ["$acctCode", 0] }, client: { $arrayElemAt: ["$client", 0] } } },
        { $project: { createdAt: 0, updatedAt: 0, __v: 0, encodedBy: 0, expenseVoucher: 0 } },
      ],
      as: "entries",
    },
  });

  pipelines.push({ $project: { createdAt: 0, updatedAt: 0, __v: 0, type: 0, encodedBy: 0 } });

  const emergencyLoans = await EmergencyLoan.aggregate(pipelines).exec();

  return emergencyLoans;
};

exports.print_summarized_by_date = async (dateFrom, dateTo) => {
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
  pipelines.push({ $lookup: { from: "banks", localField: "bankCode", foreignField: "_id", as: "bank", pipeline: [{ $project: { code: 1, description: 1 } }] } });
  pipelines.push({ $addFields: { bank: { $arrayElemAt: ["$bank", 0] } } });
  pipelines.push({ $group: { _id: "$date", emergencies: { $push: "$$ROOT" } } });
  pipelines.push({ $sort: { _id: 1 } });

  const emergencyLoans = await EmergencyLoan.aggregate(pipelines).exec();

  return emergencyLoans;
};

exports.print_by_accounts = async (accounts, dateFrom, dateTo) => {
  const pipelines = [];
  const entryFilter = { deletedAt: null };
  const accountsFilter = { deletedAt: null, _id: { $in: accounts } };

  if (dateFrom || dateTo) entryFilter.$and = [];

  if (dateFrom && isValidDate(dateFrom)) {
    let fromDate = new Date(dateFrom);
    fromDate.setHours(0, 0, 0, 0);
    entryFilter.$and.push({ "emergency.date": { $gte: fromDate } });
  }

  if (dateTo && isValidDate(dateTo)) {
    let toDate = new Date(dateTo);
    toDate.setHours(23, 59, 59, 999);
    entryFilter.$and.push({ "emergency.date": { $lte: new Date(toDate) } });
  }

  pipelines.push({ $match: accountsFilter });
  pipelines.push({ $sort: { code: 1 } });
  pipelines.push({
    $lookup: {
      from: "emergencyloanentries",
      let: { acctCodeId: "$_id" },
      pipeline: [
        { $match: { $expr: { $eq: ["$acctCode", "$$acctCodeId"] } } },
        { $lookup: { from: "emergencyloans", localField: "emergencyLoan", foreignField: "_id", as: "emergency" } },
        { $lookup: { from: "customers", localField: "client", foreignField: "_id", as: "client" } },
        {
          $addFields: {
            emergency: { $arrayElemAt: ["$emergency", 0] },
            client: { $arrayElemAt: ["$client", 0] },
          },
        },
        { $match: entryFilter },
        { $sort: { "emergency.date": 1 } },
      ],
      as: "entries",
    },
  });

  const emergencyLoans = await ChartOfAccount.aggregate(pipelines).exec();

  return emergencyLoans;
};
