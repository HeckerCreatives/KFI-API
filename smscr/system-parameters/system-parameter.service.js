const LoanReleaseEntryParam = require("./loan-release-entry-param.schema");

exports.get_loan_release_entry_params = async () => {
  const params = await LoanReleaseEntryParam.find()
    .sort("sort")
    .select("-createdAt -updatedAt -__v")
    .populate({
      path: "accountCode",
      select: "_id description",
    })
    .lean()
    .exec();
  return {
    success: true,
    loanEntryParams: params,
  };
};
