const { isValidObjectId } = require("mongoose");
const systemParamService = require("./system-parameter.service.js");
const CustomError = require("../../utils/custom-error.js");

exports.getLoanReleaseEntryParams = async (req, res, next) => {
  try {
    const result = await systemParamService.get_loan_release_entry_params();
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.getSignatureParams = async (req, res, next) => {
  try {
    const result = await systemParamService.get_signature_params();
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.updateSignatureParam = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) throw new CustomError("Invalid signature parameter id.");
    const result = await systemParamService.update_sinature_param(id, req.body);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
