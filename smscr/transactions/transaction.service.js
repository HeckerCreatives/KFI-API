const CustomError = require("../../utils/custom-error.js");
const Customer = require("../customer/customer.schema.js");
const Entry = require("./entries/entry.schema.js");
const activityLogServ = require("../activity-logs/activity-log.service.js");
const Transaction = require("./transaction.schema.js");
const { default: mongoose } = require("mongoose");
const LoanReleaseEntryParam = require("../system-parameters/loan-release-entry-param.schema.js");
const { isAmountTally } = require("../../utils/tally-amount.js");
const SignatureParam = require("../system-parameters/signature-param.js");
const Center = require("../center/center.schema.js");

exports.get_selections = async (keyword, limit, page, offset) => {
  const filter = { deletedAt: null, code: new RegExp(keyword, "i") };

  const transactionsPromise = Transaction.find(filter, { code: 1 }).skip(offset).limit(limit).lean().exec();
  const countPromise = Transaction.countDocuments(filter);

  const [count, transactions] = await Promise.all([countPromise, transactionsPromise]);

  const hasNextPage = count > offset + limit;
  const hasPrevPage = page > 1;
  const totalPages = Math.ceil(count / limit);

  return {
    success: true,
    transactions,
    hasNextPage,
    hasPrevPage,
    totalPages,
  };
};

exports.get_all = async (limit, page, offset, keyword, sort, type, to, from) => {
  const filter = { deletedAt: null, type };
  if (keyword) filter.code = new RegExp(keyword, "i");

  if (to && from) {
    filter.date = { $gte: new Date(from), $lte: new Date(to) };
  } else if (to) {
    filter.date = { $lte: new Date(to) };
  } else if (from) {
    filter.date = { $gte: new Date(from) };
  }

  const query = Transaction.find(filter);
  if (sort && ["code-asc", "code-desc"].includes(sort)) query.sort({ code: sort === "code-asc" ? 1 : -1 });
  else query.sort({ createdAt: -1 });

  const countPromise = Transaction.countDocuments(filter);
  const transactionsPromise = query
    .populate({ path: "bank", select: "code description" })
    .populate({ path: "center", select: "centerNo description" })
    .populate({ path: "loan", select: "code" })
    .populate({ path: "encodedBy", select: "-_id username" })
    .skip(offset)
    .limit(limit)
    .exec();

  const [count, transactions] = await Promise.all([countPromise, transactionsPromise]);

  const hasNextPage = count > offset + limit;
  const hasPrevPage = page > 1;
  const totalPages = Math.ceil(count / limit);

  return {
    success: true,
    transactions,
    hasNextPage,
    hasPrevPage,
    totalPages,
  };
};

exports.create_loan_release = async (data, author) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const signature = await SignatureParam.findOne({ type: "loan release" }).lean().exec();
    const center = await Center.findById(data.center).lean().exec();

    const newLoanRelease = await new Transaction({
      type: "loan release",
      code: data.cvNo.toUpperCase(),
      center: data.center,
      refNo: data.refNumber,
      remarks: data.remarks,
      date: data.date,
      acctMonth: data.acctMonth,
      acctYear: data.acctYear,
      acctOfficer: center.acctOfficer,
      noOfWeeks: data.noOfWeeks,
      loan: data.typeOfLoan,
      checkNo: data?.checkNo || "",
      checkDate: data.checkDate,
      bank: data.bankCode,
      amount: data.amount,
      cycle: data?.cycle || "",
      interest: data.interestRate,
      isEduc: data.isEduc,
      encodedBy: author._id,
      preparedBy: author.username,
      checkedBy: signature.checkedBy,
      approvedBy: signature.approvedBy,
      receivedBy: signature.receivedBy,
    }).save({ session });

    if (!newLoanRelease) {
      throw new CustomError("Failed to save loan release");
    }

    const entries = data.entries.map((entry, i) => ({
      line: entry.line,
      transaction: newLoanRelease._id,
      client: entry?.clientId || null,
      center: newLoanRelease.center,
      product: newLoanRelease.loan,
      acctCode: entry.acctCodeId,
      particular: entry.particular,
      debit: entry.debit,
      credit: entry.credit,
      interest: entry.interest,
      cycle: entry.cycle,
      checkNo: entry.checkNo,
      encodedBy: author._id,
    }));

    const addedEntries = await Entry.insertMany(entries, { session });

    if (addedEntries.length !== entries.length) {
      throw new CustomError("Failed to save loan release");
    }

    const _ids = addedEntries.map(entry => entry._id);

    const transaction = await Transaction.findById(newLoanRelease._id)
      .populate({ path: "bank", select: "code description" })
      .populate({ path: "center", select: "centerNo description" })
      .populate({ path: "loan", select: "code" })
      .populate({ path: "encodedBy", select: "-_id username" })
      .session(session)
      .exec();

    await activityLogServ.create({
      author: author._id,
      username: author.username,
      activity: `created a loan release`,
      resource: `loan release`,
      dataId: transaction._id,
      session,
    });

    await Promise.all(
      _ids.map(async id => {
        await activityLogServ.create({
          author: author._id,
          username: author.username,
          activity: `created a loan release entry`,
          resource: `loan release - entry`,
          dataId: id,
          session,
        });
      })
    );

    await session.commitTransaction();
    return {
      transaction,
      success: true,
    };
  } catch (error) {
    console.log(error);
    await session.abortTransaction();
    throw new CustomError(error.message || "Failed to create a loan release", error.statusCode || 500);
  } finally {
    await session.endSession();
  }
};

exports.update_loan_release = async (id, data, author) => {
  const filter = { deletedAt: null, _id: id };

  const entryToUpdate = data.entries.filter(entry => entry._id);
  const entryToCreate = data.entries.filter(entry => !entry._id);

  const lrUpdates = { $set: { amount: data.amount, interest: data.interestRate, cycle: data.cycle } };
  const lrOptions = { new: true };

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const updatedLoanRelease = await Transaction.findOneAndUpdate(filter, lrUpdates, lrOptions)
      .populate({ path: "bank", select: "code description" })
      .populate({ path: "center", select: "centerNo description" })
      .populate({ path: "loan", select: "code" })
      .populate({ path: "encodedBy", select: "-_id username" })
      .session(session)
      .lean()
      .exec();

    if (!updatedLoanRelease) {
      throw new CustomError("Failed to update the loan release", 500);
    }

    if (entryToCreate.length > 0) {
      const newEntries = entryToCreate.map(entry => ({
        line: entry.line,
        transaction: updatedLoanRelease._id,
        client: entry.clientId || null,
        center: updatedLoanRelease.center,
        product: updatedLoanRelease.loan,
        acctCode: entry.acctCodeId,
        particular: entry.particular,
        debit: entry.debit,
        credit: entry.credit,
        interest: entry.interest,
        cycle: entry.cycle,
        checkNo: entry.checkNo,
        encodedBy: author._id,
      }));

      const added = await Entry.insertMany(newEntries, { session });
      if (added.length !== newEntries.length) {
        throw new CustomError("Please check all the new entries you want to add", 500);
      }
    }

    if (data.deletedIds && data.deletedIds.length > 0) {
      const deleted = await Entry.updateMany({ _id: { $in: data.deletedIds }, deletedAt: { $exists: false } }, { deletedAt: new Date().toISOString() }, { session }).exec();
      if (deleted.matchedCount !== data.deletedIds.length) {
        throw new CustomError("Please make sure all the entries you want to deleted existed.", 500);
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
              acctCode: entry.acctCodeId || null,
              particular: entry.particular,
              debit: entry.debit,
              credit: entry.credit,
              interest: entry.interest,
              cycle: entry.cycle,
              checkNo: entry.checkNo,
            },
          },
        },
      }));
      const updated = await Entry.bulkWrite(updates, { session });
      if (updated.matchedCount !== updates.length) {
        throw new CustomError("Please make sure the entries you want to update is existing.", 500);
      }
    }

    const latestEntries = await Entry.find({ transaction: updatedLoanRelease._id, deletedAt: null }).populate("acctCode").session(session).lean().exec();

    const { debitCreditBalanced, netDebitCreditBalanced, netAmountBalanced } = isAmountTally(latestEntries, updatedLoanRelease.amount);
    if (!debitCreditBalanced) throw new CustomError("Debit and Credit must be balanced.", 400);
    if (!netDebitCreditBalanced) throw new CustomError("Please check all the amount in the entries", 400);
    if (!netAmountBalanced) throw new CustomError("Amount and Net Amount must be balanced", 400);

    await activityLogServ.create({
      author: author._id,
      username: author.username,
      activity: `updated a loan release along with its entries`,
      resource: `loan release`,
      dataId: updatedLoanRelease._id,
      session,
    });

    await session.commitTransaction();

    return {
      success: true,
      transaction: updatedLoanRelease,
    };
  } catch (error) {
    await session.abortTransaction();
    throw new CustomError(error.message || "Failed to update the loan release", error.statusCode || 500);
  } finally {
    await session.endSession();
  }
};

exports.load_entries = async data => {
  const clients = await Customer.find({ center: data.center, deletedAt: null, _id: { $in: data.clients } })
    .populate({ path: "center" })
    .lean()
    .exec();

  const loans = await LoanReleaseEntryParam.find()
    .sort("sort")
    .select("-createdAt -updatedAt -__v")
    .populate({
      path: "accountCode",
      select: "_id description",
    })
    .lean()
    .exec();

  const entries = [];

  clients.map(client => {
    loans.map(loan => {
      entries.push({
        clientId: client._id,
        client: client.name,
        particular: `${client.center.centerNo} - ${client.name}`,
        acctCodeId: loan.accountCode._id,
        acctCode: loan.code,
        description: loan.accountCode.description,
        debit: "",
        credit: "",
        interest: "",
        cycle: "",
        checkNo: "",
      });
    });
  });

  // const filter = { deletedAt: null, loan: data.typeOfLoan, module: "LR", loanType: data.isEduc ? "EDUC" : "OTHER" };
  // const loans = await LoanCode.find(filter).populate({ path: "acctCode" }).lean().exec();

  // const entries = [];

  // clients.map(client => {
  //   loans.map(loan => {
  //     entries.push({
  //       clientId: client._id,
  //       client: client.name,
  //       particular: `${client.center.centerNo} - ${client.name}`,
  //       acctCodeId: loan.acctCode._id,
  //       acctCode: loan.acctCode.code,
  //       description: loan.acctCode.description,
  //       debit: "",
  //       credit: "",
  //       interest: "",
  //       cycle: "",
  //       checkNo: "",
  //     });
  //   });
  // });

  return {
    success: true,
    entries,
  };
};

exports.delete_loan_release = async (filter, author) => {
  const deletedLoanRelease = await Transaction.findOneAndUpdate(filter, { $set: { deletedAt: new Date().toISOString() } }).exec();
  if (!deletedLoanRelease) {
    throw new CustomError("Failed to delete the loan release", 500);
  }

  await Entry.updateMany({ transaction: deletedLoanRelease._id }, { $set: { deletedAt: new Date().toISOString() } }).exec();

  await activityLogServ.create({
    author: author._id,
    username: author.username,
    activity: `deleted a loan release along with its linked gl entries`,
    resource: `loan release`,
    dataId: deletedLoanRelease._id,
  });

  return { success: true, transaction: filter._id };
};

exports.print_all_detailed = async (docNoFrom, docNoTo) => {
  const pipelines = [];
  const filter = { deletedAt: null };
  if (docNoFrom || docNoTo) filter.$and = [];
  if (docNoFrom) filter.$and.push({ code: { $gte: docNoFrom } });
  if (docNoTo) filter.$and.push({ code: { $lte: docNoTo } });

  pipelines.push({ $match: filter });

  pipelines.push({ $sort: { code: 1 } });

  pipelines.push({ $lookup: { from: "banks", localField: "bank", foreignField: "_id", as: "bank", pipeline: [{ $project: { code: 1, description: 1 } }] } });

  pipelines.push({ $lookup: { from: "centers", localField: "center", foreignField: "_id", as: "center", pipeline: [{ $project: { centerNo: 1, description: 1 } }] } });

  pipelines.push({ $lookup: { from: "loans", localField: "loan", foreignField: "_id", as: "loan", pipeline: [{ $project: { code: 1 } }] } });

  pipelines.push({ $addFields: { bank: { $arrayElemAt: ["$bank", 0] }, center: { $arrayElemAt: ["$center", 0] }, loan: { $arrayElemAt: ["$loan", 0] } } });

  pipelines.push({
    $lookup: {
      from: "entries",
      let: { localField: "$_id" },
      pipeline: [
        { $match: { $expr: { $eq: ["$$localField", "$transaction"] }, deletedAt: null } },
        { $lookup: { from: "chartofaccounts", localField: "acctCode", foreignField: "_id", as: "acctCode", pipeline: [{ $project: { code: 1, description: 1 } }] } },
        { $lookup: { from: "centers", localField: "center", foreignField: "_id", as: "center", pipeline: [{ $project: { centerNo: 1, description: 1 } }] } },
        { $lookup: { from: "customers", localField: "client", foreignField: "_id", as: "client", pipeline: [{ $project: { acctNumber: 1, name: 1 } }] } },
        { $lookup: { from: "loans", localField: "product", foreignField: "_id", as: "product", pipeline: [{ $project: { code: 1 } }] } },
        {
          $addFields: {
            acctCode: { $arrayElemAt: ["$acctCode", 0] },
            center: { $arrayElemAt: ["$center", 0] },
            client: { $arrayElemAt: ["$client", 0] },
            product: { $arrayElemAt: ["$product", 0] },
          },
        },
        { $project: { createdAt: 0, updatedAt: 0, __v: 0, encodedBy: 0, transaction: 0 } },
      ],
      as: "entries",
    },
  });

  pipelines.push({ $project: { createdAt: 0, updatedAt: 0, __v: 0, type: 0, encodedBy: 0 } });

  const transactions = await Transaction.aggregate(pipelines).exec();

  return transactions;
};

exports.print_all_detailed_by_date = async (dateFrom, dateTo) => {
  const pipelines = [];
  const filter = { deletedAt: null };

  if (dateFrom || dateTo) filter.$and = [];
  if (dateFrom) {
    let fromDate = new Date(dateFrom);
    fromDate.setHours(0, 0, 0, 0);
    filter.$and.push({ date: { $gte: fromDate } });
  }
  if (dateTo) {
    let toDate = new Date(dateTo);
    toDate.setHours(23, 59, 59, 999);
    filter.$and.push({ date: { $lte: new Date(toDate) } });
  }

  pipelines.push({ $match: filter });

  pipelines.push({ $sort: { date: 1 } });

  pipelines.push({ $lookup: { from: "banks", localField: "bank", foreignField: "_id", as: "bank", pipeline: [{ $project: { code: 1, description: 1 } }] } });

  pipelines.push({ $lookup: { from: "centers", localField: "center", foreignField: "_id", as: "center", pipeline: [{ $project: { centerNo: 1, description: 1 } }] } });

  pipelines.push({ $addFields: { bank: { $arrayElemAt: ["$bank", 0] }, center: { $arrayElemAt: ["$center", 0] } } });

  pipelines.push({
    $lookup: {
      from: "entries",
      let: { localField: "$_id" },
      pipeline: [
        { $match: { $expr: { $eq: ["$$localField", "$transaction"] }, deletedAt: null } },
        { $lookup: { from: "chartofaccounts", localField: "acctCode", foreignField: "_id", as: "acctCode", pipeline: [{ $project: { code: 1, description: 1 } }] } },
        { $addFields: { acctCode: { $arrayElemAt: ["$acctCode", 0] } } },
        { $project: { createdAt: 0, updatedAt: 0, __v: 0, encodedBy: 0, transaction: 0 } },
      ],
      as: "entries",
    },
  });

  pipelines.push({ $project: { createdAt: 0, updatedAt: 0, __v: 0, type: 0, encodedBy: 0 } });

  const transactions = await Transaction.aggregate(pipelines).exec();

  return transactions;
};

exports.print_all_summary_by_date = async (dateFrom, dateTo) => {
  const pipelines = [];
  const filter = { deletedAt: null };

  if (dateFrom || dateTo) filter.$and = [];
  if (dateFrom) {
    let fromDate = new Date(dateFrom);
    fromDate.setHours(0, 0, 0, 0);
    filter.$and.push({ date: { $gte: fromDate } });
  }
  if (dateTo) {
    let toDate = new Date(dateTo);
    toDate.setHours(23, 59, 59, 999);
    filter.$and.push({ date: { $lte: new Date(toDate) } });
  }

  pipelines.push({ $match: filter });

  pipelines.push({ $sort: { date: 1 } });

  pipelines.push({ $lookup: { from: "banks", localField: "bank", foreignField: "_id", as: "bank", pipeline: [{ $project: { code: 1, description: 1 } }] } });

  pipelines.push({ $lookup: { from: "centers", localField: "center", foreignField: "_id", as: "center", pipeline: [{ $project: { centerNo: 1, description: 1 } }] } });

  pipelines.push({ $addFields: { bank: { $arrayElemAt: ["$bank", 0] }, center: { $arrayElemAt: ["$center", 0] } } });

  pipelines.push({
    $lookup: {
      from: "entries",
      let: { localField: "$_id" },
      pipeline: [
        { $match: { $expr: { $eq: ["$$localField", "$transaction"] }, deletedAt: null } },
        { $lookup: { from: "chartofaccounts", localField: "acctCode", foreignField: "_id", as: "acctCode", pipeline: [{ $project: { code: 1, description: 1 } }] } },
        { $addFields: { acctCode: { $arrayElemAt: ["$acctCode", 0] } } },
        { $project: { createdAt: 0, updatedAt: 0, __v: 0, encodedBy: 0, transaction: 0 } },
      ],
      as: "entries",
    },
  });

  pipelines.push({ $project: { createdAt: 0, updatedAt: 0, __v: 0, type: 0, encodedBy: 0 } });

  const transactions = await Transaction.aggregate(pipelines).exec();

  return transactions;
};

exports.print_detailed_by_id = async transactionId => {
  const pipelines = [];
  const filter = { deletedAt: null, _id: new mongoose.Types.ObjectId(transactionId) };

  pipelines.push({ $match: filter });

  pipelines.push({ $sort: { code: 1 } });

  pipelines.push({ $lookup: { from: "banks", localField: "bank", foreignField: "_id", as: "bank", pipeline: [{ $project: { code: 1, description: 1 } }] } });

  pipelines.push({ $lookup: { from: "centers", localField: "center", foreignField: "_id", as: "center", pipeline: [{ $project: { centerNo: 1, description: 1 } }] } });

  pipelines.push({ $lookup: { from: "loans", localField: "loan", foreignField: "_id", as: "loan", pipeline: [{ $project: { code: 1 } }] } });

  pipelines.push({ $addFields: { bank: { $arrayElemAt: ["$bank", 0] }, center: { $arrayElemAt: ["$center", 0] }, loan: { $arrayElemAt: ["$loan", 0] } } });

  pipelines.push({
    $lookup: {
      from: "entries",
      let: { localField: "$_id" },
      pipeline: [
        { $match: { $expr: { $eq: ["$$localField", "$transaction"] }, deletedAt: null } },
        { $lookup: { from: "chartofaccounts", localField: "acctCode", foreignField: "_id", as: "acctCode", pipeline: [{ $project: { code: 1, description: 1 } }] } },
        { $lookup: { from: "centers", localField: "center", foreignField: "_id", as: "center", pipeline: [{ $project: { centerNo: 1, description: 1 } }] } },
        { $lookup: { from: "customers", localField: "client", foreignField: "_id", as: "client", pipeline: [{ $project: { acctNumber: 1, name: 1 } }] } },
        { $lookup: { from: "loans", localField: "product", foreignField: "_id", as: "product", pipeline: [{ $project: { code: 1 } }] } },
        {
          $addFields: {
            acctCode: { $arrayElemAt: ["$acctCode", 0] },
            center: { $arrayElemAt: ["$center", 0] },
            client: { $arrayElemAt: ["$client", 0] },
            product: { $arrayElemAt: ["$product", 0] },
          },
        },
        { $project: { createdAt: 0, updatedAt: 0, __v: 0, encodedBy: 0, transaction: 0 } },
      ],
      as: "entries",
    },
  });

  pipelines.push({ $project: { createdAt: 0, updatedAt: 0, __v: 0, type: 0, encodedBy: 0 } });

  const transactions = await Transaction.aggregate(pipelines).exec();

  return transactions;
};

exports.print_all_summary = async (docNoFrom, docNoTo) => {
  const filter = { deletedAt: null };
  if (docNoFrom || docNoTo) filter.$and = [];
  if (docNoFrom) filter.$and.push({ code: { $gte: docNoFrom } });
  if (docNoTo) filter.$and.push({ code: { $lte: docNoTo } });

  const transactions = await Transaction.find(filter).populate({ path: "center" }).populate({ path: "bank" }).sort({ code: 1 });

  return transactions;
};

exports.print_summary_by_id = async transactionId => {
  const filter = { deletedAt: null, _id: transactionId };
  const transactions = await Transaction.find(filter).populate({ path: "center" }).populate({ path: "bank" }).sort({ code: 1 });
  return transactions;
};

exports.print_file = async transactionId => {
  const loanRelease = await Transaction.findOne({ _id: transactionId, deletedAt: null }).populate("center").populate("bank").lean().exec();
  const entries = await Entry.find({ transaction: loanRelease._id, deletedAt: null })
    .sort({ line: 1 })
    .populate("center")
    .populate({
      path: "client",
      populate: [{ path: "business" }],
    })
    .populate("acctCode")
    .lean()
    .exec();
  let payTo = `CTR#${loanRelease.center.centerNo}`;

  const uniqueClientIds = [];
  entries.map(entry => {
    if (entry?.client?._id && !uniqueClientIds.includes(`${entry.client._id}`)) uniqueClientIds.push(`${entry.client._id}`);
  });

  if (uniqueClientIds.length < 2) {
    const client = await Customer.findById({ _id: uniqueClientIds[0] }).lean().exec();
    payTo = `${loanRelease.center.description} - ${client.name}`;
  }

  return {
    success: true,
    loanRelease,
    entries,
    payTo,
  };
};
