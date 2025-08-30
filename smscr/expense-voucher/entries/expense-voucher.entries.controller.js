const { isValidObjectId } = require("mongoose");
const { validatePaginationParams } = require("../../../utils/paginate-validate.js");
const entryService = require("./expense-voucher-entries.service.js");
const CustomError = require("../../../utils/custom-error.js");
const { getToken } = require("../../../utils/get-token.js");

exports.getAllEntries = async (req, res, next) => {
  try {
    const { id: expenseVoucherId } = req.params;
    if (!isValidObjectId(expenseVoucherId)) throw new CustomError("Invalid expense voucher id");
    const result = await entryService.get_all_no_pagination(expenseVoucherId);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.getEntries = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const { id: expenseVoucherId } = req.params;
    const { validatedLimit, validatedOffset, validatedPage } = validatePaginationParams(limit, page);
    if (!isValidObjectId(expenseVoucherId)) throw new CustomError("Invalid expense voucher id");
    const result = await entryService.get_all(validatedLimit, validatedPage, validatedOffset, expenseVoucherId);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.createEntry = async (req, res, next) => {
  try {
    const token = getToken(req);
    const { id: expenseVoucherId } = req.params;
    const result = await entryService.create(expenseVoucherId, req.body, token);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.updateEntry = async (req, res, next) => {
  try {
    const token = getToken(req);
    const { id: expenseVoucherId, entryId } = req.params;
    const result = await entryService.update(expenseVoucherId, entryId, req.body, token);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.deleteEntry = async (req, res, next) => {
  try {
    const token = getToken(req);
    const { id: expenseVoucherId, entryId } = req.params;
    const filter = { deletedAt: null, _id: entryId, expenseVoucher: expenseVoucherId };
    const result = await entryService.delete(filter, token);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
