const { stringEscape } = require("../../utils/escape-string.js");
const { validatePaginationParams } = require("../../utils/paginate-validate.js");
const beneficiaryService = require("./beneficiary.service.js");

exports.getBeneficiaries = async (req, res, next) => {
  try {
    const { page, limit, search } = req.query;
    const { validatedLimit, validatedOffset, validatedPage } = validatePaginationParams(limit, page);
    const result = await beneficiaryService.get_all(validatedLimit, validatedPage, validatedOffset, stringEscape(search));
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.getBeneficiary = async (req, res, next) => {
  try {
    const filter = { _id: req.params.id, deletedAt: null };
    const result = await beneficiaryService.get_single(filter);
    return res.status(200).json(result);
  } catch (error) {
    console.log(error);
    next(error);
  }
};

exports.createBeneficiary = async (req, res, next) => {
  try {
    const result = await beneficiaryService.create(req.body);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.updateBeneficiary = async (req, res, next) => {
  try {
    const filter = { _id: req.params.id };
    const result = await beneficiaryService.update(filter, req.body);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.deleteBeneficiary = async (req, res, next) => {
  try {
    const filter = { _id: req.params.id };
    const result = await beneficiaryService.delete(filter);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
