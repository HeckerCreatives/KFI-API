const { stringEscape } = require("../../utils/escape-string.js");
const { getToken } = require("../../utils/get-token.js");
const { validatePaginationParams } = require("../../utils/paginate-validate.js");
const financialStatementService = require("./financial-statement.service.js");

exports.getFinancialStatements = async (req, res, next) => {
  try {
    const { page, limit, search } = req.query;
    const { validatedLimit, validatedOffset, validatedPage } = validatePaginationParams(limit, page);
    const result = await financialStatementService.get_all_paginated(validatedLimit, validatedPage, validatedOffset, stringEscape(search));
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.createFinancialStatement = async (req, res, next) => {
  try {
    const token = getToken(req);
    const result = await financialStatementService.create(req.body, token);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.updateFinancialStatement = async (req, res, next) => {
  try {
    const token = getToken(req);
    const result = await financialStatementService.update(req.params.id, req.body, token);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.deleteFinancialStatement = async (req, res, next) => {
  try {
    const token = getToken(req);
    const result = await financialStatementService.delete(req.params.id, token);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.getAllFinancialStatementEntriesNoPagination = async (req, res, next) => {
  try {
    const result = await financialStatementService.get_all_entries_not_paginated(req.params.id);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.createFinancialStatementEntries = async (req, res, next) => {
  try {
    const token = getToken(req);
    const result = await financialStatementService.create_entries(req.params.id, req.body, token);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.updateFinancialStatementEntries = async (req, res, next) => {
  try {
    const token = getToken(req);
    const result = await financialStatementService.update_entries(req.params.id, req.body, token);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
