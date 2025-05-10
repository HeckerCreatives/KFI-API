const { stringEscape } = require("../../utils/escape-string.js");
const { validatePaginationParams } = require("../../utils/paginate-validate.js");
const journalVoucherService = require("./journal-voucher.service.js");

exports.getJournalVouchers = async (req, res, next) => {
  try {
    const { page, limit, search } = req.query;
    const { validatedLimit, validatedOffset, validatedPage } = validatePaginationParams(limit, page);
    const result = await journalVoucherService.get_all(validatedLimit, validatedPage, validatedOffset, stringEscape(search));
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.getJournalVoucher = async (req, res, next) => {
  try {
    const filter = { _id: req.params.id, deletedAt: null };
    const result = await journalVoucherService.get_single(filter);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.createJournalVoucher = async (req, res, next) => {
  try {
    const result = await journalVoucherService.create(req.body);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.updateJournalVoucher = async (req, res, next) => {
  try {
    const filter = { _id: req.params.id };
    const result = await journalVoucherService.update(filter, req.body);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.deleteJournalVoucher = async (req, res, next) => {
  try {
    const filter = { _id: req.params.id };
    const result = await journalVoucherService.delete(filter);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
