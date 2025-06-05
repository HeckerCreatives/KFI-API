const CustomError = require("../../utils/custom-error.js");
const LoanCode = require("../loan-code/loan-code.schema.js");
const Loan = require("./loan.schema.js");

exports.get_options = async () => {
  const filter = { deletedAt: null };
  const options = await Loan.find(filter, { label: "$type", value: "$_id", _id: 0 }).lean().exec();
  return {
    success: true,
    loans: options,
  };
};

exports.get_all = async (limit, page, offset, keyword, sort) => {
  const filter = { deletedAt: null };
  if (keyword) filter.$or = [{ code: new RegExp(keyword, "i") }, { description: new RegExp(keyword, "i") }];

  const query = Loan.find(filter).populate({ path: "loanCodes", select: "-createdAt", populate: { path: "acctCode" } });
  if (sort && ["code-asc", "code-desc"].includes(sort)) query.sort({ code: sort === "code-asc" ? 1 : -1 });
  else query.sort({ createdAt: -1 });

  const countPromise = Loan.countDocuments(filter);
  const loansPromise = query.skip(offset).limit(limit).exec();

  const [count, loans] = await Promise.all([countPromise, loansPromise]);

  const hasNextPage = count > offset + limit;
  const hasPrevPage = page > 1;
  const totalPages = Math.ceil(count / limit);

  return {
    success: true,
    loans,
    hasNextPage,
    hasPrevPage,
    totalPages,
  };
};

exports.get_single = async filter => {
  const loan = await Loan.findOne(filter).exec();
  if (!loan) {
    throw new CustomError("Loan not found", 404);
  }
  return { success: true, loan };
};

exports.create = async data => {
  const { code, loanCodes } = data;

  const newProductLoan = await new Loan({
    code: code.toUpperCase(),
  }).save();
  if (!newProductLoan) throw new CustomError("Failed to create product loan");

  const codes = loanCodes.map(code => ({
    loan: newProductLoan._id,
    module: code.module,
    loanType: code.loanType,
    acctCode: code.acctCode,
    sortOrder: code.sortOrder,
  }));

  const newLoanCodes = await LoanCode.insertMany(codes, { lean: true });
  const ids = newLoanCodes.map(code => code._id);

  const productLoan = await Loan.findByIdAndUpdate(newProductLoan._id, { $set: { loanCodes: ids } }, { new: true })
    .populate({ path: "loanCodes", select: "-createdAt", match: { deletedAt: null }, populate: { path: "acctCode", select: "-createdAt", match: { deletedAt: null } } })
    .exec();

  return {
    success: true,
    loan: productLoan,
  };
};

exports.update = async (filter, data) => {
  const updatedLoan = await Loan.findOneAndUpdate(filter, { $set: { code: data.code.toUpperCase() } }, { new: true })
    .populate({ path: "loanCodes", select: "-createdAt", match: { deletedAt: null }, populate: { path: "acctCode", select: "-createdAt", match: { deletedAt: null } } })
    .exec();
  if (!updatedLoan) {
    throw new CustomError("Failed to update the loan", 500);
  }

  return { success: true, loan: updatedLoan };
};

exports.delete = async filter => {
  const deletedLoan = await Loan.findOneAndUpdate(filter, { $set: { deletedAt: new Date().toISOString() } }).exec();
  if (!deletedLoan) {
    throw new CustomError("Failed to delete the loan", 500);
  }
  await LoanCode.updateMany({ _id: { $in: deletedLoan.loanCodes } }, { $set: { deletedAt: new Date().toISOString() } }).exec();
  return { success: true, loan: filter._id };
};
