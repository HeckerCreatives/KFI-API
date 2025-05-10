const { stringEscape } = require("../../utils/escape-string.js");
const { validatePaginationParams } = require("../../utils/paginate-validate.js");
const damayanFundService = require("./damayan-fund.service.js");

exports.getDamayanFunds = async (req, res, next) => {
  try {
    const { page, limit, search } = req.query;
    const { validatedLimit, validatedOffset, validatedPage } = validatePaginationParams(limit, page);
    const result = await damayanFundService.get_all(validatedLimit, validatedPage, validatedOffset, stringEscape(search));
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.getDamayanFund = async (req, res, next) => {
  try {
    const filter = { _id: req.params.id, deletedAt: null };
    const result = await damayanFundService.get_single(filter);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.createDamayanFund = async (req, res, next) => {
  try {
    const result = await damayanFundService.create(req.body);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.updateDamayanFund = async (req, res, next) => {
  try {
    const filter = { _id: req.params.id };
    const result = await damayanFundService.update(filter, req.body);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.deleteDamayanFund = async (req, res, next) => {
  try {
    const filter = { _id: req.params.id };
    const result = await damayanFundService.delete(filter);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
