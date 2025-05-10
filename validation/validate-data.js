const CustomError = require("../utils/custom-error.js");
const { validationResult } = require("express-validator");

exports.validateData = async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const groupedErrors = errors.array().reduce((acc, error) => {
      if (!acc[error.path]) {
        acc[error.path] = [];
      }
      acc[error.path].push(error.msg);
      return acc;
    }, {});

    const formattedErrors = Object.keys(groupedErrors).map(path => ({
      path,
      msgs: groupedErrors[path],
    }));

    next(new CustomError("Invalid data", 400, formattedErrors));
  } else {
    next();
  }
};
