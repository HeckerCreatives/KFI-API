const { stringEscape } = require("../../utils/escape-string.js");
const { getToken } = require("../../utils/get-token.js");
const { validatePaginationParams } = require("../../utils/paginate-validate.js");
const loanReleaseService = require("./loan-release.service.js");

exports.getLoanReleases = async (req, res, next) => {
  try {
    const { page, limit, search } = req.query;
    const { validatedLimit, validatedOffset, validatedPage } = validatePaginationParams(limit, page);
    const result = await loanReleaseService.get_all(validatedLimit, validatedPage, validatedOffset, stringEscape(search));
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.getLoanRelease = async (req, res, next) => {
  try {
    const filter = { _id: req.params.id, deletedAt: null };
    const result = await loanReleaseService.get_single(filter);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.createLoanRelease = async (req, res, next) => {
  try {
    const token = getToken(req);
    const result = await loanReleaseService.create(req.body, token._id);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.updateLoanRelease = async (req, res, next) => {
  try {
    const filter = { _id: req.params.id };
    const result = await loanReleaseService.update(filter, req.body);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.deleteLoanRelease = async (req, res, next) => {
  try {
    const filter = { _id: req.params.id };
    const result = await loanReleaseService.delete(filter);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
