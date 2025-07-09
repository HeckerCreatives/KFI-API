const { isValidObjectId } = require("mongoose");
const { validatePaginationParams } = require("../../../utils/paginate-validate.js");
const entryService = require("./release-entries.service.js");
const CustomError = require("../../../utils/custom-error.js");
const { getToken } = require("../../../utils/get-token.js");

exports.getEntries = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const { id: releaseId } = req.params;
    const { validatedLimit, validatedOffset, validatedPage } = validatePaginationParams(limit, page);
    if (!isValidObjectId(releaseId)) throw new CustomError("Invalid release id");
    const result = await entryService.get_all(validatedLimit, validatedPage, validatedOffset, releaseId);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.createEntry = async (req, res, next) => {
  try {
    const token = getToken(req);
    const { id: releaseId } = req.params;
    const result = await entryService.create(releaseId, req.body, token);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.updateEntry = async (req, res, next) => {
  try {
    const token = getToken(req);
    const { id: releaseId, entryId } = req.params;
    const result = await entryService.update(releaseId, entryId, req.body, token);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.deleteEntry = async (req, res, next) => {
  try {
    const token = getToken(req);
    const { id: releaseId, entryId } = req.params;
    const filter = { deletedAt: null, _id: entryId, acknowledgement: releaseId };
    const result = await entryService.delete(filter, token);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
