const { stringEscape } = require("../../utils/escape-string.js");
const { validatePaginationParams } = require("../../utils/paginate-validate.js");
const statService = require("./statistics.service.js");

exports.getDashboardCardStatistics = async (req, res, next) => {
  try {
    const result = await statService.dashboard_card_statistics();
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.getRecentMembers = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const { validatedLimit, validatedOffset, validatedPage } = validatePaginationParams(limit, page);
    const result = await statService.recent_member(validatedLimit, validatedPage, validatedOffset);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.getRecentLoans = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const { validatedLimit, validatedOffset, validatedPage } = validatePaginationParams(limit, page);
    const result = await statService.recent_loan(validatedLimit, validatedPage, validatedOffset);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.getLoansPerCenter = async (req, res, next) => {
  try {
    const { page, limit, keyword } = req.query;
    const { validatedLimit, validatedOffset, validatedPage } = validatePaginationParams(limit, page);
    const result = await statService.loans_per_account_officer(validatedLimit, validatedPage, validatedOffset, stringEscape(keyword));
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
