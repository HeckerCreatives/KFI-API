const { validatePaginationParams } = require("../../utils/paginate-validate.js");
const loginLogService = require("./login-log.service.js");

exports.getLogs = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const { validatedLimit, validatedOffset, validatedPage } = validatePaginationParams(limit, page);
    const result = await loginLogService.get_all(validatedLimit, validatedPage, validatedOffset);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
