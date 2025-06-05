const CustomError = require("../../utils/custom-error.js");
const LoanCode = require("../loan-code/loan-code.schema.js");
const Loan = require("../loan/loan.schema.js");

exports.get_single = async filter => {
  const loan = await LoanCode.findOne(filter).exec();
  if (!loan) {
    throw new CustomError("Loan code not found", 404);
  }
  return { success: true, loan };
};

exports.create = async data => {
  const newLoanCode = await new LoanCode({
    loan: data.loan,
    module: data.module,
    loanType: data.loanType,
    acctCode: data.acctCode,
    sortOrder: data.sortOrder,
  }).save();

  if (!newLoanCode) throw new CustomError("Failed to create a new loan code");

  const productLoan = await Loan.findByIdAndUpdate(newLoanCode.loan, { $push: { loanCodes: newLoanCode._id } }, { new: true })
    .populate({ path: "loanCodes", select: "-createdAt", match: { deletedAt: null }, populate: { path: "acctCode", select: "-createdAt", match: { deletedAt: null } } })
    .exec();

  return {
    success: true,
    loan: productLoan,
  };
};

exports.update = async (filter, data) => {
  const updateLoanCode = await LoanCode.findOneAndUpdate(
    filter,
    { $set: { module: data.module, loanType: data.loanType, acctCode: data.acctCode, sortOrder: data.sortOrder } },
    { new: true }
  ).exec();
  if (!updateLoanCode) {
    throw new CustomError("Failed to update the loan code", 500);
  }
  const productLoan = await Loan.findById(updateLoanCode.loan)
    .populate({ path: "loanCodes", select: "-createdAt", match: { deletedAt: null }, populate: { path: "acctCode", select: "-createdAt", match: { deletedAt: null } } })
    .exec();

  return { success: true, loan: productLoan };
};

exports.delete = async filter => {
  const deletedLoan = await LoanCode.findOneAndUpdate(filter, { $set: { deletedAt: new Date().toISOString() } }).exec();
  if (!deletedLoan) throw new CustomError("Failed to delete the loan code");

  const updatedLoan = await Loan.findOneAndUpdate({ _id: deletedLoan.loan }, { $pull: { loanCodes: deletedLoan._id } }, { new: true })
    .populate({ path: "loanCodes", select: "-createdAt", match: { deletedAt: null }, populate: { path: "acctCode", select: "-createdAt", match: { deletedAt: null } } })
    .exec();

  if (!updatedLoan) throw new CustomError("Failed to delete the loan code", 500);

  return { success: true, loan: updatedLoan };
};
