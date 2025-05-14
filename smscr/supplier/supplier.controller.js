const { stringEscape } = require("../../utils/escape-string.js");
const { validatePaginationParams } = require("../../utils/paginate-validate.js");
const supplierService = require("./supplier.service.js");

exports.getSuppliers = async (req, res, next) => {
  try {
    const { page, limit, search, sort } = req.query;
    const { validatedLimit, validatedOffset, validatedPage } = validatePaginationParams(limit, page);
    const validatedSort = ["code-asc", "code-desc", "description-asc", "description-desc"].includes(sort) ? sort : "";
    const result = await supplierService.get_all(validatedLimit, validatedPage, validatedOffset, stringEscape(search), validatedSort);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.getSupplier = async (req, res, next) => {
  try {
    const filter = { _id: req.params.id, deletedAt: null };
    const result = await supplierService.get_single(filter);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.createSupplier = async (req, res, next) => {
  try {
    const result = await supplierService.create(req.body);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.updateSupplier = async (req, res, next) => {
  try {
    const filter = { _id: req.params.id };
    const result = await supplierService.update(filter, req.body);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.deleteSupplier = async (req, res, next) => {
  try {
    const filter = { _id: req.params.id };
    const result = await supplierService.delete(filter);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
