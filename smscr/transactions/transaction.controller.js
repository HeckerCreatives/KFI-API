const { validateDateInput } = require("../../utils/date.js");
const { stringEscape } = require("../../utils/escape-string.js");
const { getToken } = require("../../utils/get-token.js");
const { validatePaginationParams } = require("../../utils/paginate-validate.js");
const transactionServ = require("./transaction.service.js");

exports.getLoanReleases = async (req, res, next) => {
  try {
    const { page, limit, search, sort, to, from } = req.query;
    const validatedSort = ["code-asc", "code-desc"].includes(sort) ? sort : "";
    const { validatedLimit, validatedOffset, validatedPage } = validatePaginationParams(limit, page);
    const validatedFrom = validateDateInput(from);
    const validatedTo = validateDateInput(to);

    const result = await transactionServ.get_all(validatedLimit, validatedPage, validatedOffset, stringEscape(search), validatedSort, "loan release", validatedTo, validatedFrom);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.loadEntries = async (req, res, next) => {
  try {
    const result = await transactionServ.load_entries(req.body);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.createLoanRelease = async (req, res, next) => {
  try {
    const token = getToken(req);
    const result = await transactionServ.create_loan_release(req.body, token);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.updateLoanRelease = async (req, res, next) => {
  try {
    const token = getToken(req);
    const { id } = req.params;
    const result = await transactionServ.update_loan_release(id, req.body, token);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.deleteLoanRelease = async (req, res, next) => {
  try {
    const token = getToken(req);
    const { id } = req.params;
    const filter = { deletedAt: null, _id: id };
    const result = await transactionServ.delete_loan_release(filter, token);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
