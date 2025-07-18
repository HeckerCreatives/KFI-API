const CustomError = require("../../utils/custom-error.js");
const DamayanFund = require("./damayan-fund.schema.js");
const DamayanFundEntry = require("./entries/damayan-fund-entries.schema.js");
const activityLogServ = require("../activity-logs/activity-log.service.js");
const PaymentSchedule = require("../payment-schedules/payment-schedule.schema.js");
const mongoose = require("mongoose");
const { setPaymentDates } = require("../../utils/date.js");
const { upsertWallet } = require("../wallets/wallet.service.js");

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
    .populate({ path: "bankCode", select: "code description" })
    .populate({ path: "supplier", select: "code description" })
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
    .populate({ path: "bankCode", select: "code description" })
    .populate({ path: "supplier", select: "code description" })
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
    const newDamayanFund = await new DamayanFund({
      code: data.code.toUpperCase(),
      supplier: data.supplier,
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
    }).save({ session });

    if (!newDamayanFund) {
      throw new CustomError("Failed to create a new damayan fund", 500);
    }

    const entries = data.entries.map(entry => ({
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

    // const currentEntries = await DamayanFundEntry.find({ _id: { $in: _ids }, client: { $ne: null } })
    //   .populate("acctCode")
    //   .session(session)
    //   .lean()
    //   .exec();

    const damayanFund = await DamayanFund.findById(newDamayanFund._id)
      .populate({ path: "bankCode", select: "code description" })
      .populate({ path: "supplier", select: "code description" })
      .populate({ path: "encodedBy", select: "-_id username" })
      .session(session)
      .exec();

    // const paymentSchedules = setPaymentDates(20, newDamayanFund.date);
    // const payments = [];
    // await Promise.all(
    //   currentEntries.map(async entry => {
    //     await upsertWallet(entry.client, "EL", entry.debit, session);
    //     paymentSchedules.map(schedule => {
    //       payments.push({
    //         emergencyLoan: entry.emergencyLoan,
    //         emergencyLoanEntry: entry._id,
    //         date: schedule.date,
    //         paid: schedule.paid,
    //       });
    //     });
    //   })
    // );

    // const schedules = await PaymentSchedule.insertMany(payments, { session });
    // if (schedules.length !== payments.length) {
    //   throw new CustomError("Failed to save emergency loan");
    // }

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
  const updated = await DamayanFund.findOneAndUpdate(
    filter,
    {
      $set: {
        code: data.code.toUpperCase(),
        supplier: data.supplier,
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
    .populate({ path: "supplier", select: "code description" })
    .populate({ path: "encodedBy", select: "-_id username" })
    .exec();
  if (!updated) {
    throw new CustomError("Failed to update the damayan fund", 500);
  }

  await activityLogServ.create({
    author: author._id,
    username: author.username,
    activity: `updated an damayan fund`,
    resource: `damayan fund`,
    dataId: updated._id,
  });

  return { success: true, damayanFund: updated };
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

  pipelines.push({ $lookup: { from: "suppliers", localField: "supplier", foreignField: "_id", as: "supplier", pipeline: [{ $project: { code: 1, description: 1 } }] } });

  pipelines.push({ $addFields: { bankCode: { $arrayElemAt: ["$bankCode", 0] }, supplier: { $arrayElemAt: ["$supplier", 0] } } });

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

  pipelines.push({ $lookup: { from: "suppliers", localField: "supplier", foreignField: "_id", as: "supplier", pipeline: [{ $project: { code: 1, description: 1 } }] } });

  pipelines.push({ $addFields: { bankCode: { $arrayElemAt: ["$bankCode", 0] }, supplier: { $arrayElemAt: ["$supplier", 0] } } });

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
  const damayanFunds = await DamayanFund.find(filter).populate({ path: "bankCode" }).populate({ path: "supplier" }).sort({ code: 1 });
  return damayanFunds;
};

exports.print_summary_by_id = async damayanFundId => {
  const filter = { deletedAt: null, _id: damayanFundId };
  const damayanFunds = await DamayanFund.find(filter).populate({ path: "bankCode" }).populate({ path: "supplier" }).sort({ code: 1 });
  return damayanFunds;
};
