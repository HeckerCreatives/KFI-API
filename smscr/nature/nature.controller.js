const { stringEscape } = require("../../utils/escape-string.js");
const { validatePaginationParams } = require("../../utils/paginate-validate.js");
const natureService = require("./nature.service.js");

exports.getNatures = async (req, res, next) => {
  try {
    const { page, limit, search, sort } = req.query;
    const { validatedLimit, validatedOffset, validatedPage } = validatePaginationParams(limit, page);
    const validatedSort = ["type-asc", "type-desc"].includes(sort) ? sort : "";
    const result = await natureService.get_all(validatedLimit, validatedPage, validatedOffset, stringEscape(search), validatedSort);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.getNature = async (req, res, next) => {
  try {
    const filter = { _id: req.params.id, deletedAt: null };
    const result = await natureService.get_single(filter);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.createNature = async (req, res, next) => {
  try {
    const result = await natureService.create(req.body);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.updateNature = async (req, res, next) => {
  try {
    const filter = { _id: req.params.id };
    const result = await natureService.update(filter, req.body);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.deleteNature = async (req, res, next) => {
  try {
    const filter = { _id: req.params.id };
    const result = await natureService.delete(filter);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
