const { stringEscape } = require("../../utils/escape-string.js");
const { validatePaginationParams } = require("../../utils/paginate-validate.js");
const officialReceiptService = require("./official-receipt.service.js");

exports.getOfficialReceipts = async (req, res, next) => {
  try {
    const { page, limit, search } = req.query;
    const { validatedLimit, validatedOffset, validatedPage } = validatePaginationParams(limit, page);
    const result = await officialReceiptService.get_all(validatedLimit, validatedPage, validatedOffset, stringEscape(search));
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.getOfficialReceipt = async (req, res, next) => {
  try {
    const filter = { _id: req.params.id, deletedAt: null };
    const result = await officialReceiptService.get_single(filter);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.createOfficialReceipt = async (req, res, next) => {
  try {
    const result = await officialReceiptService.create(req.body);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.updateOfficialReceipt = async (req, res, next) => {
  try {
    const filter = { _id: req.params.id };
    const result = await officialReceiptService.update(filter, req.body);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.deleteOfficialReceipt = async (req, res, next) => {
  try {
    const filter = { _id: req.params.id };
    const result = await officialReceiptService.delete(filter);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
