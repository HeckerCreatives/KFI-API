const systemParamService = require("./system-parameter.service.js");

exports.getLoanReleaseEntryParams = async (req, res, next) => {
  try {
    const result = await systemParamService.get_loan_release_entry_params();
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
