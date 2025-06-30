const { isValidObjectId } = require("mongoose");
const { validatePaginationParams } = require("../../../utils/paginate-validate.js");
const entryService = require("./jounal-voucher-entries.service.js");
const CustomError = require("../../../utils/custom-error.js");
const { getToken } = require("../../../utils/get-token.js");

exports.getEntries = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const { id: journalVoucherId } = req.params;
    const { validatedLimit, validatedOffset, validatedPage } = validatePaginationParams(limit, page);
    if (!isValidObjectId(journalVoucherId)) throw new CustomError("Invalid expense voucher id");
    const result = await entryService.get_all(validatedLimit, validatedPage, validatedOffset, journalVoucherId);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.createEntry = async (req, res, next) => {
  try {
    const token = getToken(req);
    const { id: journalVoucherId } = req.params;
    const result = await entryService.create(journalVoucherId, req.body, token);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.updateEntry = async (req, res, next) => {
  try {
    const token = getToken(req);
    const { id: journalVoucherId, entryId } = req.params;
    const result = await entryService.update(journalVoucherId, entryId, req.body, token);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.deleteEntry = async (req, res, next) => {
  try {
    const token = getToken(req);
    const { id: journalVoucherId, entryId } = req.params;
    const filter = { deletedAt: null, _id: entryId, journalVoucher: journalVoucherId };
    const result = await entryService.delete(filter, token);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
