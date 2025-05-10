const { stringEscape } = require("../../utils/escape-string.js");
const { validatePaginationParams } = require("../../utils/paginate-validate.js");
const weeklySavingTimeService = require("./weekly-saving-time.service.js");

exports.getWeeklySavingTimes = async (req, res, next) => {
  try {
    const { page, limit, search } = req.query;
    const { validatedLimit, validatedOffset, validatedPage } = validatePaginationParams(limit, page);
    const result = await weeklySavingTimeService.get_all(validatedLimit, validatedPage, validatedOffset, stringEscape(search));
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.getWeeklySavingTime = async (req, res, next) => {
  try {
    const filter = { _id: req.params.id, deletedAt: null };
    const result = await weeklySavingTimeService.get_single(filter);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.createWeeklySavingTime = async (req, res, next) => {
  try {
    const result = await weeklySavingTimeService.create(req.body);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.updateWeeklySavingTime = async (req, res, next) => {
  try {
    const filter = { _id: req.params.id };
    const result = await weeklySavingTimeService.update(filter, req.body);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.deleteWeeklySavingTime = async (req, res, next) => {
  try {
    const filter = { _id: req.params.id };
    const result = await weeklySavingTimeService.delete(filter);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
