const CustomError = require("../../utils/custom-error.js");
const Customer = require("../customer/customer.schema.js");
const LoanCode = require("../loan-code/loan-code.schema.js");
const Entry = require("./entries/entry.schema.js");
const activityLogServ = require("../activity-logs/activity-log.service.js");
const Transaction = require("./transaction.schema.js");

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
  const newLoanRelease = await new Transaction({
    type: "loan release",
    code: data.cvNo.toUpperCase(),
    center: data.center,
    refNo: data.refNumber,
    remarks: data.remarks,
    date: data.date,
    acctMonth: data.acctMonth,
    acctYear: data.acctYear,
    noOfWeeks: data.noOfWeeks,
    loan: data.typeOfLoan,
    checkNo: data.checkNo,
    checkDate: data.checkDate,
    bank: data.bankCode,
    amount: data.amount,
    cycle: data.cycle,
    interest: data.interestRate,
    isEduc: data.isEduc,
    encodedBy: author._id,
  }).save();

  if (!newLoanRelease) {
    throw new CustomError("Failed to save loan release");
  }

  const entries = data.entries.map(entry => ({
    transaction: newLoanRelease._id,
    client: entry.clientId,
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

  const addedEntries = await Entry.insertMany(entries);

  if (addedEntries.length !== entries.length) {
    throw new CustomError("Failed to save loan release");
  }

  const _ids = addedEntries.map(entry => entry._id);

  const transaction = await Transaction.findById(newLoanRelease._id)
    .populate({ path: "bank", select: "code description" })
    .populate({ path: "center", select: "centerNo description" })
    .populate({ path: "loan", select: "code" })
    .populate({ path: "encodedBy", select: "-_id username" })
    .exec();

  await activityLogServ.create({
    author: author._id,
    username: author.username,
    activity: `created a loan release`,
    resource: `loan release`,
    dataId: transaction._id,
  });

  await Promise.all(
    _ids.map(async id => {
      await activityLogServ.create({
        author: author._id,
        username: author.username,
        activity: `created a loan release entry`,
        resource: `loan release - entry`,
        dataId: id,
      });
    })
  );

  return {
    transaction,
    success: true,
  };
};

exports.update_loan_release = async (id, data, author) => {
  const filter = { deletedAt: null, _id: id };
  const updates = {
    $set: {
      amount: data.amount,
      interest: data.interestRate,
      cycle: data.cycle,
    },
  };
  const options = { new: true };
  const updatedLoanRelease = await Transaction.findOneAndUpdate(filter, updates, options)
    .populate({ path: "bank", select: "code description" })
    .populate({ path: "center", select: "centerNo description" })
    .populate({ path: "loan", select: "code" })
    .populate({ path: "encodedBy", select: "-_id username" })
    .lean()
    .exec();

  if (!updatedLoanRelease) {
    throw new CustomError("Failed to update the loan release", 500);
  }

  await activityLogServ.create({
    author: author._id,
    username: author.username,
    activity: `updated a loan release`,
    resource: `loan release`,
    dataId: updatedLoanRelease._id,
  });

  return {
    success: true,
    transaction: updatedLoanRelease,
  };
};

exports.load_entries = async data => {
  const clients = await Customer.find({ center: data.center, deletedAt: null }).populate({ path: "center" }).lean().exec();
  const filter = { deletedAt: null, loan: data.typeOfLoan, module: "LR", loanType: data.isEduc ? "EDUC" : "OTHER" };
  const loans = await LoanCode.find(filter).populate({ path: "acctCode" }).lean().exec();

  const entries = [];

  clients.map(client => {
    loans.map(loan => {
      entries.push({
        clientId: client._id,
        client: client.name,
        particular: `${client.center.centerNo} - ${client.name}`,
        acctCodeId: loan.acctCode._id,
        acctCode: loan.acctCode.code,
        description: loan.acctCode.description,
        debit: "",
        credit: "",
        interest: "",
        cycle: "",
        checkNo: "",
      });
    });
  });

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
