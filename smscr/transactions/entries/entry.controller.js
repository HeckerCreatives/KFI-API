const { isValidObjectId } = require("mongoose");
const entryService = require("./entry.service.js");
const CustomError = require("../../../utils/custom-error.js");
const { validatePaginationParams } = require("../../../utils/paginate-validate.js");
const { getToken } = require("../../../utils/get-token.js");
const { stringEscape } = require("../../../utils/escape-string.js");

exports.loadEntries = async (req, res, next) => {
  try {
    const result = await entryService.loan_entries(req.body.centerLabel);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.getSelections = async (req, res, next) => {
  try {
    const { page, limit, keyword } = req.query;
    const { validatedLimit, validatedOffset, validatedPage } = validatePaginationParams(limit, page);
    const result = await entryService.get_selections(stringEscape(keyword), validatedLimit, validatedPage, validatedOffset);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.getEntries = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const { id: transactionId } = req.params;
    const { validatedLimit, validatedOffset, validatedPage } = validatePaginationParams(limit, page);
    if (!isValidObjectId(transactionId)) throw new CustomError("Invalid transaction id");
    const result = await entryService.get_all(validatedLimit, validatedPage, validatedOffset, transactionId);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.createEntry = async (req, res, next) => {
  try {
    const token = getToken(req);
    const { id: transactionId } = req.params;
    const result = await entryService.create(transactionId, req.body, token);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.updateEntry = async (req, res, next) => {
  try {
    const token = getToken(req);
    const { id: transactionId, entryId } = req.params;
    const result = await entryService.update(transactionId, entryId, req.body, token);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.deleteEntry = async (req, res, next) => {
  try {
    const token = getToken(req);
    const { id: transactionId, entryId } = req.params;
    const filter = { deletedAt: null, _id: entryId, transaction: transactionId };
    const result = await entryService.delete(filter, token);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
