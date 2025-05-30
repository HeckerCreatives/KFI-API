const CustomError = require("../../utils/custom-error.js");
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

  const query = Loan.find(filter);
  if (sort && ["code-asc", "code-desc"].includes(sort)) query.sort({ code: sort === "code-asc" ? 1 : -1 });
  else if (sort && ["description-asc", "description-desc"].includes(sort)) query.sort({ description: sort === "description-asc" ? 1 : -1 });
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
  const newLoan = await new Loan({
    code: data.code.toUpperCase(),
    description: data.description,
  }).save();
  if (!newLoan) {
    throw new CustomError("Failed to create a new loan", 500);
  }
  return {
    success: true,
    loan: newLoan,
  };
};

exports.update = async (filter, data) => {
  const updatedLoan = await Loan.findOneAndUpdate(
    filter,
    {
      $set: {
        code: data.code.toUpperCase(),
        description: data.description,
      },
    },
    { new: true }
  ).exec();
  if (!updatedLoan) {
    throw new CustomError("Failed to update the loan", 500);
  }
  return { success: true, loan: updatedLoan };
};

exports.delete = async filter => {
  const deletedLoan = await Loan.updateOne(filter, { $set: { deletedAt: new Date().toISOString() } }).exec();
  if (!deletedLoan.acknowledged || deletedLoan.modifiedCount < 1) {
    throw new CustomError("Failed to delete the loan", 500);
  }
  return { success: true, loan: filter._id };
};
