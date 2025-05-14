const { stringEscape } = require("../../utils/escape-string.js");
const { validatePaginationParams } = require("../../utils/paginate-validate.js");
const groupAcctService = require("./group-account.service.js");

exports.getGroupAccounts = async (req, res, next) => {
  try {
    const { page, limit, search, sort } = req.query;
    const validatedSort = ["code-asc", "code-desc"].includes(sort) ? sort : "";
    const { validatedLimit, validatedOffset, validatedPage } = validatePaginationParams(limit, page);
    const result = await groupAcctService.get_all(validatedLimit, validatedPage, validatedOffset, stringEscape(search), validatedSort);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.getGroupAccount = async (req, res, next) => {
  try {
    const filter = { _id: req.params.id, deletedAt: null };
    const result = await groupAcctService.get_single(filter);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.createGroupAccount = async (req, res, next) => {
  try {
    const result = await groupAcctService.create(req.body);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.updateGroupAccount = async (req, res, next) => {
  try {
    const filter = { _id: req.params.id };
    const result = await groupAcctService.update(filter, req.body);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.deleteGroupAccount = async (req, res, next) => {
  try {
    const filter = { _id: req.params.id };
    const result = await groupAcctService.delete(filter);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
