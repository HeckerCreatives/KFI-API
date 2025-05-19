const CustomError = require("../../utils/custom-error.js");
const LoanRelease = require("./loan-release.schema.js");

exports.get_all = async (limit, page, offset, keyword) => {
  const filter = { deletedAt: null };
  if (keyword) filter.code = new RegExp(keyword, "i");

  const countPromise = LoanRelease.countDocuments(filter);
  const loanReleasesSchema = LoanRelease.find(filter).skip(offset).limit(limit).exec();

  const [count, loanReleases] = await Promise.all([countPromise, loanReleasesSchema]);

  const hasNextPage = count > offset + limit;
  const hasPrevPage = page > 1;
  const totalPages = Math.ceil(count / limit);

  return {
    success: true,
    loanReleases,
    hasNextPage,
    hasPrevPage,
    totalPages,
  };
};

exports.get_single = async filter => {
  const loanRelease = await LoanRelease.findOne(filter).exec();
  if (!loanRelease) {
    throw new CustomError("Loan release not found", 404);
  }
  return { success: true, loanRelease };
};

exports.create = async (data, userId) => {
  const newLoanRelease = await new LoanRelease({
    cvNo: data.cvNo,
    center: data.center,
    name: data.name,
    refNumber: data.refNumber,
    date: data.date,
    acctMonth: data.acctMonth,
    noOfWeeks: data.noOfWeeks,
    typeOfLoan: data.typeOfLoan,
    checkNo: data.checkNo,
    checkDate: data.checkDate,
    bankCode: data.bankCode,
    amount: data.amount,
    cycle: data.cycle,
    interestRate: data.interestRate,
    remarks: data.remarks,
    payee: data.payee,
    encodedBy: userId,
  }).save();
  if (!newLoanRelease) {
    throw new CustomError("Failed to create a new loan release", 500);
  }
  return {
    success: true,
    loanRelease: newLoanRelease,
  };
};

exports.update = async (filter, data) => {
  const updatedLoanRelease = await LoanRelease.findOneAndUpdate(
    filter,
    {
      $set: {
        cvNo: data.cvNo,
        center: data.center,
        date: data.date,
        acctMonth: data.acctMonth,
        noOfWeeks: data.noOfWeeks,
        typeOfLoan: data.typeOfLoan,
        checkNo: data.checkNo,
        checkDate: data.checkDate,
        bankCode: data.bankCode,
        amount: data.amount,
        cycle: data.cycle,
        interestRate: data.interestRate,
        remarks: data.remarks,
        payee: data.payee,
      },
    },
    { new: true }
  ).exec();
  if (!updatedLoanRelease) {
    throw new CustomError("Failed to update the loan release", 500);
  }
  return { success: true, loanRelease: updatedLoanRelease };
};

exports.delete = async filter => {
  const deleteLoanRealease = await LoanRelease.updateOne(filter, { $set: { deletedAt: new Date().toISOString() } }).exec();
  if (!deleteLoanRealease.acknowledged || deleteLoanRealease.modifiedCount < 1) {
    throw new CustomError("Failed to delete the loan release", 500);
  }
  return { success: true, loanRelease: filter._id };
};
