const { stringEscape } = require("../../utils/escape-string.js");
const { validatePaginationParams } = require("../../utils/paginate-validate.js");
const childrenService = require("./children.service.js");

exports.getChildren = async (req, res, next) => {
  try {
    const { page, limit, search } = req.query;
    const { validatedLimit, validatedOffset, validatedPage } = validatePaginationParams(limit, page);
    const result = await childrenService.get_all(validatedLimit, validatedPage, validatedOffset, stringEscape(search));
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.getChild = async (req, res, next) => {
  try {
    const filter = { _id: req.params.id, deletedAt: null };
    const result = await childrenService.get_single(filter);
    return res.status(200).json(result);
  } catch (error) {
    console.log(error);
    next(error);
  }
};

exports.createChild = async (req, res, next) => {
  try {
    const result = await childrenService.create(req.body);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.updateChild = async (req, res, next) => {
  try {
    const filter = { _id: req.params.id };
    const result = await childrenService.update(filter, req.body);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.deleteChild = async (req, res, next) => {
  try {
    const filter = { _id: req.params.id };
    const result = await childrenService.delete(filter);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
