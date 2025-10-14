const CustomError = require("../../utils/custom-error.js");
const DamayanFund = require("./damayan-fund.schema.js");
const DamayanFundEntry = require("./entries/damayan-fund-entries.schema.js");
const activityLogServ = require("../activity-logs/activity-log.service.js");
const mongoose = require("mongoose");
const Customer = require("../customer/customer.schema.js");
const ChartOfAccount = require("../chart-of-account/chart-of-account.schema.js");
const { isAmountTally } = require("../../utils/tally-amount.js");
const SignatureParam = require("../system-parameters/signature-param.js");
const { isValidDate } = require("../../utils/date.js");
const Bank = require("../banks/bank.schema.js");

exports.get_selections = async (keyword, limit, page, offset) => {
  const filter = { deletedAt: null, code: new RegExp(keyword, "i") };

  const damayanFundsPromise = DamayanFund.find(filter, { code: 1 }).skip(offset).limit(limit).lean().exec();
  const countPromise = DamayanFund.countDocuments(filter);

  const [count, damayanFunds] = await Promise.all([countPromise, damayanFundsPromise]);

  const hasNextPage = count > offset + limit;
  const hasPrevPage = page > 1;
  const totalPages = Math.ceil(count / limit);

  return {
    success: true,
    damayanFunds,
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

  const query = DamayanFund.find(filter);
  if (sort && ["code-asc", "code-desc"].includes(sort)) query.sort({ code: sort === "code-asc" ? 1 : -1 });
  else query.sort({ createdAt: -1 });

  const countPromise = DamayanFund.countDocuments(filter);
  const damayanFundsPromise = query
    .populate({ path: "center", select: "centerNo description" })
    .populate({ path: "bankCode", select: "code description" })
    .populate({ path: "encodedBy", select: "-_id username" })
    .lean()
    .skip(offset)
    .limit(limit)
    .exec();

  const [count, damayanFunds] = await Promise.all([countPromise, damayanFundsPromise]);

  const hasNextPage = count > offset + limit;
  const hasPrevPage = page > 1;
  const totalPages = Math.ceil(count / limit);

  return {
    success: true,
    damayanFunds,
    hasNextPage,
    hasPrevPage,
    totalPages,
  };
};

exports.get_single = async filter => {
  const damayanFund = await DamayanFund.findOne(filter)
    .populate({ path: "center", select: "centerNo description" })
    .populate({ path: "bankCode", select: "code description" })
    .populate({ path: "encodedBy", select: "-_id username" })
    .lean()
    .exec();
  if (!damayanFund) {
    throw new CustomError("Damayan fund not found", 404);
  }
  return { success: true, damayanFund };
};

exports.create = async (data, author) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const signature = await SignatureParam.findOne({ type: "damayan fund" }).lean().exec();
    const newDamayanFund = await new DamayanFund({
      code: data.code.toUpperCase(),
      nature: data.nature,
      center: data.center,
      name: data.name,
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

    if (!newDamayanFund) {
      throw new CustomError("Failed to create a new damayan fund", 500);
    }

    const entries = data.entries.map(entry => ({
      line: entry.line,
      damayanFund: newDamayanFund._id,
      client: entry.client || null,
      particular: entry.particular || null,
      acctCode: entry.acctCodeId,
      debit: entry.debit,
      credit: entry.credit,
    }));

    const newEntries = await DamayanFundEntry.insertMany(entries, { session });

    if (newEntries.length !== entries.length) {
      throw new CustomError("Failed to create an damayan fund");
    }

    const _ids = newEntries.map(entry => entry._id);

    const damayanFund = await DamayanFund.findById(newDamayanFund._id)
      .populate({ path: "center", select: "centerNo description" })
      .populate({ path: "bankCode", select: "code description" })
      .populate({ path: "encodedBy", select: "-_id username" })
      .session(session)
      .exec();

    await activityLogServ.create({
      author: author._id,
      username: author.username,
      activity: `created an damayan fund`,
      resource: `damayan fund`,
      dataId: damayanFund._id,
      session,
    });

    await Promise.all(
      _ids.map(async id => {
        await activityLogServ.create({
          author: author._id,
          username: author.username,
          activity: `created a damayan fund entry`,
          resource: `damayan fund - entry`,
          dataId: id,
          session,
        });
      })
    );

    await session.commitTransaction();

    return {
      success: true,
      damayanFund,
    };
  } catch (error) {
    await session.abortTransaction();
    throw new CustomError(error.message || "Failed to create an damayan fund", error.statusCode || 500);
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

    const updated = await DamayanFund.findOneAndUpdate(
      filter,
      {
        $set: {
          code: data.code.toUpperCase(),
          nature: data.nature,
          center: data.center,
          name: data.name,
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
      .populate({ path: "center", select: "centerNo description" })
      .populate({ path: "bankCode", select: "code description" })
      .populate({ path: "encodedBy", select: "-_id username" })
      .exec();

    if (!updated) {
      throw new CustomError("Failed to update the damayan fund", 500);
    }

    if (entryToCreate.length > 0) {
      const newEntries = entryToCreate.map(entry => ({
        line: entry.line,
        damayanFund: updated._id,
        client: entry.client || null,
        particular: entry.particular || null,
        acctCode: entry.acctCodeId,
        debit: entry.debit,
        credit: entry.credit,
        encodedBy: author._id,
      }));

      const added = await DamayanFundEntry.insertMany(newEntries, { session });
      if (added.length !== newEntries.length) {
        throw new CustomError("Failed to update the damayan fund", 500);
      }
    }

    if (data.deletedIds && data.deletedIds.length > 0) {
      const deleted = await DamayanFundEntry.updateMany(
        { _id: { $in: data.deletedIds }, deletedAt: { $exists: false } },
        { deletedAt: new Date().toISOString() },
        { session }
      ).exec();
      if (deleted.matchedCount !== data.deletedIds.length) {
        throw new CustomError("Failed to update the damayan fund", 500);
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
      const updated = await DamayanFundEntry.bulkWrite(updates, { session });
      if (updated.matchedCount !== updates.length) {
        throw new CustomError("Failed to update the damayan fund", 500);
      }
    }

    const latestEntries = await DamayanFundEntry.find({ damayanFund: updated._id, deletedAt: null }).populate("acctCode").session(session).lean().exec();
    const { debitCreditBalanced, netDebitCreditBalanced, netAmountBalanced } = isAmountTally(latestEntries, updated.amount);
    if (!debitCreditBalanced) throw new CustomError("Debit and Credit must be balanced.", 400);
    if (!netDebitCreditBalanced) throw new CustomError("Please check all the amount in the entries", 400);
    if (!netAmountBalanced) throw new CustomError("Amount and Net Amount must be balanced", 400);

    await activityLogServ.create({
      author: author._id,
      username: author.username,
      activity: `updated an damayan fund`,
      resource: `damayan fund`,
      dataId: updated._id,
      session,
    });

    await session.commitTransaction();

    return {
      success: true,
      damayanFund: updated,
    };
  } catch (error) {
    await session.abortTransaction();
    throw new CustomError(error.message || "Failed to update damayan fund", error.statusCode || 500);
  } finally {
    await session.endSession();
  }
};

exports.delete = async (filter, author) => {
  const deleted = await DamayanFund.findOneAndUpdate(filter, { $set: { deletedAt: new Date().toISOString() } }).exec();
  if (!deleted) throw new CustomError("Failed to delete the damayan fund", 500);

  await DamayanFundEntry.updateMany({ damayanFund: deleted._id }, { $set: { deletedAt: new Date().toISOString() } }).exec();

  await activityLogServ.create({
    author: author._id,
    username: author.username,
    activity: `deleted an damayan fund along with its linked gl entries`,
    resource: `damayan fund`,
    dataId: deleted._id,
  });

  return { success: true, damayanFund: filter._id };
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

  pipelines.push({ $addFields: { bankCode: { $arrayElemAt: ["$bankCode", 0] } } });

  pipelines.push({
    $lookup: {
      from: "damayanfundentries",
      let: { localField: "$_id" },
      pipeline: [
        { $match: { $expr: { $eq: ["$$localField", "$damayanFund"] }, deletedAt: null } },
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

  const damayanFunds = await DamayanFund.aggregate(pipelines).exec();

  return damayanFunds;
};

exports.print_detailed_by_id = async damayanFundId => {
  const pipelines = [];
  const filter = { deletedAt: null, _id: new mongoose.Types.ObjectId(damayanFundId) };

  pipelines.push({ $match: filter });

  pipelines.push({ $sort: { code: 1 } });

  pipelines.push({ $lookup: { from: "banks", localField: "bankCode", foreignField: "_id", as: "bankCode", pipeline: [{ $project: { code: 1, description: 1 } }] } });

  pipelines.push({ $addFields: { bankCode: { $arrayElemAt: ["$bankCode", 0] } } });

  pipelines.push({
    $lookup: {
      from: "damayanfundentries",
      let: { localField: "$_id" },
      pipeline: [
        { $match: { $expr: { $eq: ["$$localField", "$damayanFund"] }, deletedAt: null } },
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

  const damayanFunds = await DamayanFund.aggregate(pipelines).exec();

  return damayanFunds;
};

exports.print_all_summary = async (docNoFrom, docNoTo) => {
  const filter = { deletedAt: null };
  if (docNoFrom || docNoTo) filter.$and = [];
  if (docNoFrom) filter.$and.push({ code: { $gte: docNoFrom } });
  if (docNoTo) filter.$and.push({ code: { $lte: docNoTo } });
  const damayanFunds = await DamayanFund.find(filter).populate({ path: "bankCode" }).sort({ code: 1 });
  return damayanFunds;
};

exports.print_summary_by_id = async damayanFundId => {
  const filter = { deletedAt: null, _id: damayanFundId };
  const damayanFunds = await DamayanFund.find(filter).populate({ path: "bankCode" }).sort({ code: 1 });
  return damayanFunds;
};

exports.load_entries = async (center, amount, includeAllCentersActiveMembers, resignedIncluded) => {
  const filter = { deletedAt: null };
  const statuses = ["Active-Existing", "Active-New", "Active-PastDue", "Active-Returnee"];
  if (!includeAllCentersActiveMembers) filter.center = new mongoose.Types.ObjectId(center);
  if (resignedIncluded) statuses.push("Resigned");
  filter.memberStatus = { $in: statuses };

  const acctCode = await ChartOfAccount.findOne({ deletedAt: null, code: "2010D" }).lean().exec();
  if (!acctCode) throw new CustomError("Invalid account code");

  // const clients = await Customer.find(filter).select("name center").populate("center").lean().exec();
  // const entries = clients.map(client => ({
  //   client: client._id,
  //   clientName: client.name,
  //   particular: `${client.center.centerNo} - ${client.name}`,
  //   acctCode: acctCode._id,
  //   acctCodeLabel: acctCode.description,
  //   debit: Number(amount),
  //   credit: 0,
  // }));

  const pipelines = [];

  pipelines.push({ $match: filter });
  pipelines.push({ $lookup: { from: "centers", localField: "center", foreignField: "_id", as: "center" } });
  pipelines.push({ $unwind: "$center" });
  pipelines.push({
    $project: {
      _id: 0,
      client: "$_id",
      clientName: "$name",
      particular: { $concat: [`$center.centerNo`, `-`, `$name`] },
      acctCodeId: `${acctCode._id}`,
      acctCodeLabel: `${acctCode.description}`,
      debit: `${Number(amount)}`,
      credit: `${Number(0)}`,
    },
  });

  const entries = await Customer.aggregate(pipelines).exec();

  return {
    success: true,
    entries,
  };
};

exports.print_file = async id => {
  const damayan = await DamayanFund.findOne({ _id: id, deletedAt: null }).populate("bankCode").lean().exec();
  const entries = await DamayanFundEntry.find({ damayanFund: damayan._id, deletedAt: null }).sort({ line: 1 }).populate("client").populate("acctCode").lean().exec();

  return {
    success: true,
    damayan,
    entries,
  };
};

exports.print_detailed_by_date = async (dateFrom, dateTo, type) => {
  const pipelines = [];
  const filter = { deletedAt: null, code: new RegExp(type === "cv" ? "CV#" : "JV#") };

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
      from: "damayanfundentries",
      let: { localField: "$_id" },
      pipeline: [
        { $match: { $expr: { $eq: ["$$localField", "$damayanFund"] }, deletedAt: null } },
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

  const damayanFunds = await DamayanFund.aggregate(pipelines).exec();

  return damayanFunds;
};

exports.print_summarized_by_date = async (dateFrom, dateTo, type) => {
  const pipelines = [];
  const filter = { deletedAt: null, code: new RegExp(type === "cv" ? "CV#" : "JV#") };

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
  pipelines.push({ $group: { _id: "$date", damayans: { $push: "$$ROOT" } } });
  pipelines.push({ $sort: { _id: 1 } });

  const damayanFunds = await DamayanFund.aggregate(pipelines).exec();

  return damayanFunds;
};

exports.print_all_by_bank = async bankIds => {
  const pipelines = [];

  pipelines.push({ $match: { deletedAt: null, _id: { $in: bankIds } } });

  pipelines.push({
    $lookup: {
      from: "damayanfunds",
      let: { localField: "$_id" },
      pipeline: [{ $match: { $expr: { $eq: ["$$localField", "$bankCode"] }, deletedAt: null } }],
      as: "damayans",
    },
  });

  const banks = await Bank.aggregate(pipelines).exec();

  return banks;
};

exports.print_by_accounts = async (accounts, dateFrom, dateTo) => {
  const pipelines = [];
  const entryFilter = { deletedAt: null };
  const accountsFilter = { deletedAt: null, _id: { $in: accounts } };

  if (dateFrom || dateTo) entryFilter.$and = [];

  if (dateFrom && isValidDate(dateFrom)) {
    let fromDate = new Date(dateFrom);
    fromDate.setHours(0, 0, 0, 0);
    entryFilter.$and.push({ "damayan.date": { $gte: fromDate } });
  }

  if (dateTo && isValidDate(dateTo)) {
    let toDate = new Date(dateTo);
    toDate.setHours(23, 59, 59, 999);
    entryFilter.$and.push({ "damayan.date": { $lte: new Date(toDate) } });
  }

  pipelines.push({ $match: accountsFilter });
  pipelines.push({ $sort: { code: 1 } });
  pipelines.push({
    $lookup: {
      from: "damayanfundentries",
      let: { acctCodeId: "$_id" },
      pipeline: [
        { $match: { $expr: { $eq: ["$acctCode", "$$acctCodeId"] } } },
        { $lookup: { from: "damayanfunds", localField: "damayanFund", foreignField: "_id", as: "damayan" } },
        { $lookup: { from: "customers", localField: "client", foreignField: "_id", as: "client" } },
        {
          $addFields: {
            damayan: { $arrayElemAt: ["$damayan", 0] },
            client: { $arrayElemAt: ["$client", 0] },
          },
        },
        { $match: entryFilter },
        { $sort: { "damayan.date": 1 } },
      ],
      as: "entries",
    },
  });

  const damayanFunds = await ChartOfAccount.aggregate(pipelines).exec();

  return damayanFunds;
};
