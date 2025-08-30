const { isValidObjectId } = require("mongoose");
const { validatePaginationParams } = require("../../../utils/paginate-validate.js");
const entryService = require("./damayan-fund-entries.service.js");
const CustomError = require("../../../utils/custom-error.js");
const { getToken } = require("../../../utils/get-token.js");

exports.getAllEntries = async (req, res, next) => {
  try {
    const { id: damayanFundId } = req.params;
    if (!isValidObjectId(damayanFundId)) throw new CustomError("Invalid damayan fund id");
    const result = await entryService.get_all_no_pagination(damayanFundId);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.getEntries = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const { id: damayanFundId } = req.params;
    const { validatedLimit, validatedOffset, validatedPage } = validatePaginationParams(limit, page);
    if (!isValidObjectId(damayanFundId)) throw new CustomError("Invalid damayan fund id");
    const result = await entryService.get_all(validatedLimit, validatedPage, validatedOffset, damayanFundId);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.createEntry = async (req, res, next) => {
  try {
    const token = getToken(req);
    const { id: damayanFundId } = req.params;
    const result = await entryService.create(damayanFundId, req.body, token);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.updateEntry = async (req, res, next) => {
  try {
    const token = getToken(req);
    const { id: damayanFundId, entryId } = req.params;
    const result = await entryService.update(damayanFundId, entryId, req.body, token);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.deleteEntry = async (req, res, next) => {
  try {
    const token = getToken(req);
    const { id: damayanFundId, entryId } = req.params;
    const filter = { deletedAt: null, _id: entryId, expenseVoucher: damayanFundId };
    const result = await entryService.delete(filter, token);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
