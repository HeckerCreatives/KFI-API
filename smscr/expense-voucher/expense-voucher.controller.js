const { stringEscape } = require("../../utils/escape-string.js");
const { validatePaginationParams } = require("../../utils/paginate-validate.js");
const expenseVoucherService = require("./expense-voucher.service.js");

exports.getExpenseVouchers = async (req, res, next) => {
  try {
    const { page, limit, search } = req.query;
    const { validatedLimit, validatedOffset, validatedPage } = validatePaginationParams(limit, page);
    const result = await expenseVoucherService.get_all(validatedLimit, validatedPage, validatedOffset, stringEscape(search));
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.getExpenseVoucher = async (req, res, next) => {
  try {
    const filter = { _id: req.params.id, deletedAt: null };
    const result = await expenseVoucherService.get_single(filter);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.createExpenseVoucher = async (req, res, next) => {
  try {
    const result = await expenseVoucherService.create(req.body);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.updateExpenseVoucher = async (req, res, next) => {
  try {
    const filter = { _id: req.params.id };
    const result = await expenseVoucherService.update(filter, req.body);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.deleteExpenseVoucher = async (req, res, next) => {
  try {
    const filter = { _id: req.params.id };
    const result = await expenseVoucherService.delete(filter);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
