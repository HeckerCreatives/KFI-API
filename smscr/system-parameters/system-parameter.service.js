const CustomError = require("../../utils/custom-error");
const LoanReleaseEntryParam = require("./loan-release-entry-param.schema");
const SignatureParam = require("./signature-param");

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

exports.get_signature_params = async () => {
  const params = await SignatureParam.find().select("-createdAt -updatedAt -__v").lean().exec();

  return {
    success: true,
    signatureParams: params,
  };
};

exports.update_sinature_param = async (id, data) => {
  const filter = { _id: id };
  const updates = {
    $set: {
      approvedBy: data?.approvedBy || "",
      checkedBy: data?.checkedBy || "",
      receivedBy: data?.receivedBy || "",
    },
  };
  const options = { new: true };

  const updated = await SignatureParam.findOneAndUpdate(filter, updates, options).select("-createdAt -updatedAt -__v").lean().exec();
  if (!updated) throw new CustomError("Failed to update the signature param", 500);

  return {
    success: true,
    signatureParam: updated,
  };
};

exports.get_signature_by_type = async type => {
  const signatureParam = await SignatureParam.findOne({ type }).select("-createdAt -updatedAt -__v").lean().exec();
  return {
    success: true,
    signatureParam,
  };
};
