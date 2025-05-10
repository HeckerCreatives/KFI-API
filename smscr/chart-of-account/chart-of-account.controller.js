const { stringEscape } = require("../../utils/escape-string.js");
const { validatePaginationParams } = require("../../utils/paginate-validate.js");
const chartOfAccountService = require("./chart-of-account.service.js");

exports.getChartOfAccounts = async (req, res, next) => {
  try {
    const { page, limit, search } = req.query;
    const { validatedLimit, validatedOffset, validatedPage } = validatePaginationParams(limit, page);
    const result = await chartOfAccountService.get_all(validatedLimit, validatedPage, validatedOffset, stringEscape(search));
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.getChartOfAccount = async (req, res, next) => {
  try {
    const filter = { _id: req.params.id, deletedAt: null };
    const result = await chartOfAccountService.get_single(filter);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.createChartOfAccount = async (req, res, next) => {
  try {
    const result = await chartOfAccountService.create(req.body);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.updateChartOfAccount = async (req, res, next) => {
  try {
    const filter = { _id: req.params.id };
    const result = await chartOfAccountService.update(filter, req.body);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.deleteChartOfAccount = async (req, res, next) => {
  try {
    const filter = { _id: req.params.id };
    const result = await chartOfAccountService.delete(filter);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
