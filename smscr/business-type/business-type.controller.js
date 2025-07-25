const { stringEscape } = require("../../utils/escape-string.js");
const { getToken } = require("../../utils/get-token.js");
const { validatePaginationParams } = require("../../utils/paginate-validate.js");
const businessTypeService = require("./business-type.service.js");

exports.getSelections = async (req, res, next) => {
  try {
    const { keyword } = req.query;
    const result = await businessTypeService.get_selections(stringEscape(keyword));
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.getOptions = async (req, res, next) => {
  try {
    const result = await businessTypeService.get_options();
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.getBusinessTypes = async (req, res, next) => {
  try {
    const { page, limit, search, sort } = req.query;
    const { validatedLimit, validatedOffset, validatedPage } = validatePaginationParams(limit, page);
    const validatedSort = ["type-asc", "type-desc"].includes(sort) ? sort : "";
    const result = await businessTypeService.get_all(validatedLimit, validatedPage, validatedOffset, stringEscape(search), validatedSort);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.getBusinessType = async (req, res, next) => {
  try {
    const filter = { _id: req.params.id, deletedAt: null };
    const result = await businessTypeService.get_single(filter);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.createBusinessType = async (req, res, next) => {
  try {
    const token = getToken(req);
    const result = await businessTypeService.create(req.body, token);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.updateBusinessType = async (req, res, next) => {
  try {
    const token = getToken(req);
    const filter = { _id: req.params.id };
    const result = await businessTypeService.update(filter, req.body, token);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.deleteBusinessType = async (req, res, next) => {
  try {
    const token = getToken(req);
    const filter = { _id: req.params.id };
    const result = await businessTypeService.delete(filter, token);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
