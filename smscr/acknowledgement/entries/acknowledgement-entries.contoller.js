const { isValidObjectId } = require("mongoose");
const { validatePaginationParams } = require("../../../utils/paginate-validate.js");
const entryService = require("./acknowledgement-entries.service.js");
const CustomError = require("../../../utils/custom-error.js");
const { getToken } = require("../../../utils/get-token.js");

exports.getEntries = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const { id: acknowledgementId } = req.params;
    const { validatedLimit, validatedOffset, validatedPage } = validatePaginationParams(limit, page);
    if (!isValidObjectId(acknowledgementId)) throw new CustomError("Invalid acknowledgement id");
    const result = await entryService.get_all(validatedLimit, validatedPage, validatedOffset, acknowledgementId);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.createEntry = async (req, res, next) => {
  try {
    const token = getToken(req);
    const { id: acknowledgementId } = req.params;
    const result = await entryService.create(acknowledgementId, req.body, token);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.updateEntry = async (req, res, next) => {
  try {
    const token = getToken(req);
    const { id: acknowledgementId, entryId } = req.params;
    const result = await entryService.update(acknowledgementId, entryId, req.body, token);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.deleteEntry = async (req, res, next) => {
  try {
    const token = getToken(req);
    const { id: acknowledgementId, entryId } = req.params;
    const filter = { deletedAt: null, _id: entryId, acknowledgement: acknowledgementId };
    const result = await entryService.delete(filter, token);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
