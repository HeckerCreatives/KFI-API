const { stringEscape } = require("../../utils/escape-string.js");
const { validatePaginationParams } = require("../../utils/paginate-validate.js");
const statusService = require("./status.service.js");

exports.getSelections = async (req, res, next) => {
  try {
    const { keyword } = req.query;
    const result = await statusService.get_selections(stringEscape(keyword));
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.getOptions = async (req, res, next) => {
  try {
    const result = await statusService.get_options();
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.getStatuses = async (req, res, next) => {
  try {
    const { page, limit, search, sort } = req.query;
    const validatedSort = ["code-asc", "code-desc", "description-asc", "description-desc"].includes(sort) ? sort : "";
    const { validatedLimit, validatedOffset, validatedPage } = validatePaginationParams(limit, page);
    const result = await statusService.get_all(validatedLimit, validatedPage, validatedOffset, stringEscape(search), validatedSort);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.getStatus = async (req, res, next) => {
  try {
    const filter = { _id: req.params.id, deletedAt: null };
    const result = await statusService.get_single(filter);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.createStatus = async (req, res, next) => {
  try {
    const result = await statusService.create(req.body);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.updateStatus = async (req, res, next) => {
  try {
    const filter = { _id: req.params.id };
    const result = await statusService.update(filter, req.body);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.deleteStatus = async (req, res, next) => {
  try {
    const filter = { _id: req.params.id };
    const result = await statusService.delete(filter);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
