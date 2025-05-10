const { stringEscape } = require("../../utils/escape-string.js");
const { validatePaginationParams } = require("../../utils/paginate-validate.js");
const weeklySavingService = require("./weekly-saving.service.js");

exports.getWeeklySavings = async (req, res, next) => {
  try {
    const { page, limit, search } = req.query;
    const { validatedLimit, validatedOffset, validatedPage } = validatePaginationParams(limit, page);
    const result = await weeklySavingService.get_all(validatedLimit, validatedPage, validatedOffset, stringEscape(search));
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.getWeeklySaving = async (req, res, next) => {
  try {
    const filter = { _id: req.params.id, deletedAt: null };
    const result = await weeklySavingService.get_single(filter);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.createWeeklySaving = async (req, res, next) => {
  try {
    const result = await weeklySavingService.create(req.body);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.updateWeeklySaving = async (req, res, next) => {
  try {
    const filter = { _id: req.params.id };
    const result = await weeklySavingService.update(filter, req.body);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.deleteWeeklySaving = async (req, res, next) => {
  try {
    const filter = { _id: req.params.id };
    const result = await weeklySavingService.delete(filter);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
