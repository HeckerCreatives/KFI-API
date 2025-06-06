const { stringEscape } = require("../../utils/escape-string.js");
const { validatePaginationParams } = require("../../utils/paginate-validate.js");
const loanService = require("./loan.service.js");
const loanCodeService = require("../loan-code/loan-code.service.js");
const { getToken } = require("../../utils/get-token.js");

exports.getOptions = async (req, res, next) => {
  try {
    const result = await loanService.get_options();
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.getLoans = async (req, res, next) => {
  try {
    const { page, limit, search, sort } = req.query;
    const validatedSort = ["code-asc", "code-desc", "description-asc", "description-desc"].includes(sort) ? sort : "";
    const { validatedLimit, validatedOffset, validatedPage } = validatePaginationParams(limit, page);
    const result = await loanService.get_all(validatedLimit, validatedPage, validatedOffset, stringEscape(search), validatedSort);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.getLoan = async (req, res, next) => {
  try {
    const filter = { _id: req.params.id, deletedAt: null };
    const result = await loanService.get_single(filter);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.createLoan = async (req, res, next) => {
  try {
    const token = getToken(req);
    const result = await loanService.create(req.body, token);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.createLoanCode = async (req, res, next) => {
  try {
    const token = getToken(req);
    const result = await loanCodeService.create(req.body, token);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.updateLoan = async (req, res, next) => {
  try {
    const token = getToken(req);
    const filter = { _id: req.params.id, deletedAt: null };
    const result = await loanService.update(filter, req.body, token);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.updateLoanCode = async (req, res, next) => {
  try {
    const token = getToken(req);
    const filter = { _id: req.params.id, deletedAt: null };
    const result = await loanCodeService.update(filter, req.body, token);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.deleteLoan = async (req, res, next) => {
  try {
    const token = getToken(req);
    const filter = { _id: req.params.id, deletedAt: null };
    const result = await loanService.delete(filter, token);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.deleteLoanCode = async (req, res, next) => {
  try {
    const token = getToken(req);
    const filter = { _id: req.params.id, deletedAt: null };
    const result = await loanCodeService.delete(filter, token);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
