const CustomError = require("../../utils/custom-error.js");
const EmergencyLoan = require("./emergency-loan.schema.js");
const EmergencyLoanEntry = require("./entries/emergency-loan-entry.schema.js");
const activityLogServ = require("../activity-logs/activity-log.service.js");
const PaymentSchedule = require("../payment-schedules/payment-schedule.schema.js");
const mongoose = require("mongoose");
const { setPaymentDates } = require("../../utils/date.js");
const { upsertWallet } = require("../wallets/wallet.service.js");

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
    .populate({ path: "supplier", select: "code description" })
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
    const newEmergencyLoan = await new EmergencyLoan({
      code: data.code,
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

    if (!newEmergencyLoan) {
      throw new CustomError("Failed to create a new emergency loan", 500);
    }

    const entries = data.entries.map(entry => ({
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
      .populate({ path: "supplier", select: "code description" })
      .populate({ path: "encodedBy", select: "-_id username" })
      .session(session)
      .exec();

    const paymentSchedules = setPaymentDates(20, newEmergencyLoan.date);
    const payments = [];
    await Promise.all(
      currentEntries.map(async entry => {
        await upsertWallet(entry.client, "EL", entry.debit, session);
        paymentSchedules.map(schedule => {
          payments.push({
            emergencyLoan: entry.emergencyLoan,
            emergencyLoanEntry: entry._id,
            date: schedule.date,
            paid: schedule.paid,
          });
        });
      })
    );

    const schedules = await PaymentSchedule.insertMany(payments, { session });
    if (schedules.length !== payments.length) {
      throw new CustomError("Failed to save emergency loan");
    }

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
  const updatedEmergencyLoan = await EmergencyLoan.findOneAndUpdate(
    filter,
    {
      $set: {
        code: data.code,
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
  if (!updatedEmergencyLoan) {
    throw new CustomError("Failed to update the emergency loan", 500);
  }

  await activityLogServ.create({
    author: author._id,
    username: author.username,
    activity: `updated an emergency loan`,
    resource: `emergency loan`,
    dataId: updatedEmergencyLoan._id,
  });

  return { success: true, emergencyLoan: updatedEmergencyLoan };
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

  pipelines.push({ $lookup: { from: "suppliers", localField: "supplier", foreignField: "_id", as: "supplier", pipeline: [{ $project: { code: 1, description: 1 } }] } });

  pipelines.push({ $addFields: { bankCode: { $arrayElemAt: ["$bankCode", 0] }, supplier: { $arrayElemAt: ["$supplier", 0] } } });

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

  pipelines.push({ $lookup: { from: "suppliers", localField: "supplier", foreignField: "_id", as: "supplier", pipeline: [{ $project: { code: 1, description: 1 } }] } });

  pipelines.push({ $addFields: { bankCode: { $arrayElemAt: ["$bankCode", 0] }, supplier: { $arrayElemAt: ["$supplier", 0] } } });

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
  const emergencyLoans = await EmergencyLoan.find(filter).populate({ path: "bankCode" }).populate({ path: "supplier" }).sort({ code: 1 });
  return emergencyLoans;
};

exports.print_summary_by_id = async emergencyLoanId => {
  const filter = { deletedAt: null, _id: emergencyLoanId };
  const emergencyLoans = await EmergencyLoan.find(filter).populate({ path: "bankCode" }).populate({ path: "supplier" }).sort({ code: 1 });
  return emergencyLoans;
};
