const { stringEscape } = require("../../utils/escape-string.js");
const { validatePaginationParams } = require("../../utils/paginate-validate.js");
const centerService = require("./center.service.js");

exports.getCenters = async (req, res, next) => {
  try {
    const { page, limit, search, sort } = req.query;
    const validatedSort = ["centerno-asc", "centerno-desc", "description-asc", "description-desc"].includes(sort) ? sort : "";
    const { validatedLimit, validatedOffset, validatedPage } = validatePaginationParams(limit, page);
    const result = await centerService.get_all(validatedLimit, validatedPage, validatedOffset, stringEscape(search), validatedSort);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.getCenter = async (req, res, next) => {
  try {
    const filter = { _id: req.params.id, deletedAt: null };
    const result = await centerService.get_single(filter);
    return res.status(200).json(result);
  } catch (error) {
    console.log(error);
    next(error);
  }
};

exports.createCenter = async (req, res, next) => {
  try {
    const result = await centerService.create(req.body);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.updateCenter = async (req, res, next) => {
  try {
    const filter = { _id: req.params.id };
    const result = await centerService.update(filter, req.body);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.deleteCenter = async (req, res, next) => {
  try {
    const filter = { _id: req.params.id };
    const result = await centerService.delete(filter);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
