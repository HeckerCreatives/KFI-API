const { stringEscape } = require("../../utils/escape-string.js");
const { getToken } = require("../../utils/get-token.js");
const { validatePaginationParams } = require("../../utils/paginate-validate.js");
const trialBalanceService = require("./trial-balance.service.js");

exports.getTrialBalances = async (req, res, next) => {
  try {
    const { page, limit, search } = req.query;
    const { validatedLimit, validatedOffset, validatedPage } = validatePaginationParams(limit, page);
    const result = await trialBalanceService.get_all_paginated(validatedLimit, validatedPage, validatedOffset, stringEscape(search));
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.createTrialBalance = async (req, res, next) => {
  try {
    const token = getToken(req);
    const result = await trialBalanceService.create(req.body, token);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.updateTrialBalance = async (req, res, next) => {
  try {
    const token = getToken(req);
    const result = await trialBalanceService.update(req.params.id, req.body, token);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.deleteTrialBalance = async (req, res, next) => {
  try {
    const token = getToken(req);
    const result = await trialBalanceService.delete(req.params.id, token);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.getAllTrialBalanceEntriesNoPagination = async (req, res, next) => {
  try {
    const result = await trialBalanceService.get_all_entries_not_paginated(req.params.id);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.createTrialBalanceEntries = async (req, res, next) => {
  try {
    const token = getToken(req);
    const result = await trialBalanceService.create_entries(req.params.id, req.body, token);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.updateTrialBalanceEntries = async (req, res, next) => {
  try {
    const token = getToken(req);
    const result = await trialBalanceService.update_entries(req.params.id, req.body, token);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
