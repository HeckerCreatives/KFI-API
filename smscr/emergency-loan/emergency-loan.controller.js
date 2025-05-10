const { stringEscape } = require("../../utils/escape-string.js");
const { validatePaginationParams } = require("../../utils/paginate-validate.js");
const emergencyLoanService = require("./emergency-loan.service.js");

exports.getEmergencyLoans = async (req, res, next) => {
  try {
    const { page, limit, search } = req.query;
    const { validatedLimit, validatedOffset, validatedPage } = validatePaginationParams(limit, page);
    const result = await emergencyLoanService.get_all(validatedLimit, validatedPage, validatedOffset, stringEscape(search));
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.getEmergencyLoan = async (req, res, next) => {
  try {
    const filter = { _id: req.params.id, deletedAt: null };
    const result = await emergencyLoanService.get_single(filter);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.createEmergencyLoan = async (req, res, next) => {
  try {
    const result = await emergencyLoanService.create(req.body);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.updateEmergencyLoan = async (req, res, next) => {
  try {
    const filter = { _id: req.params.id };
    const result = await emergencyLoanService.update(filter, req.body);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.deleteEmergencyLoan = async (req, res, next) => {
  try {
    const filter = { _id: req.params.id };
    const result = await emergencyLoanService.delete(filter);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
