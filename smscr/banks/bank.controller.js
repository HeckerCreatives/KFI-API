const { stringEscape } = require("../../utils/escape-string.js");
const { validatePaginationParams } = require("../../utils/paginate-validate.js");
const bankService = require("./bank.service.js");

exports.getBanks = async (req, res, next) => {
  try {
    const { page, limit, search } = req.query;
    const { validatedLimit, validatedOffset, validatedPage } = validatePaginationParams(limit, page);
    const result = await bankService.get_all(validatedLimit, validatedPage, validatedOffset, stringEscape(search));
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.getBank = async (req, res, next) => {
  try {
    const filter = { _id: req.params.id, deletedAt: null };
    const result = await bankService.get_single(filter);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.createBank = async (req, res, next) => {
  try {
    const result = await bankService.create(req.body);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.updateBank = async (req, res, next) => {
  try {
    const filter = { _id: req.params.id };
    const result = await bankService.update(filter, req.body);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.deleteBank = async (req, res, next) => {
  try {
    const filter = { _id: req.params.id };
    const result = await bankService.delete(filter);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
