const { isValidObjectId } = require("mongoose");
const { validatePaginationParams } = require("../../../utils/paginate-validate.js");
const entryService = require("./emergency-loan-entry.service.js");
const CustomError = require("../../../utils/custom-error.js");
const { getToken } = require("../../../utils/get-token.js");

exports.getEntries = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const { id: emergencyLoanId } = req.params;
    const { validatedLimit, validatedOffset, validatedPage } = validatePaginationParams(limit, page);
    if (!isValidObjectId(emergencyLoanId)) throw new CustomError("Invalid emergency loan id");
    const result = await entryService.get_all(validatedLimit, validatedPage, validatedOffset, emergencyLoanId);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.createEntry = async (req, res, next) => {
  try {
    const token = getToken(req);
    const { id: emergencyLoanId } = req.params;
    const result = await entryService.create(emergencyLoanId, req.body, token);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.updateEntry = async (req, res, next) => {
  try {
    const token = getToken(req);
    const { id: emergencyLoanId, entryId } = req.params;
    const result = await entryService.update(emergencyLoanId, entryId, req.body, token);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.deleteEntry = async (req, res, next) => {
  try {
    const token = getToken(req);
    const { id: emergencyLoanId, entryId } = req.params;
    const filter = { deletedAt: null, _id: entryId, expenseVoucher: emergencyLoanId };
    const result = await entryService.delete(filter, token);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
