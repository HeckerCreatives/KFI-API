const CustomError = require("../utils/custom-error.js");
const { validationResult } = require("express-validator");
const fs = require("fs");

exports.validateData = async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    if (req.file) await fs.promises.unlink(req.file.path);
    if (req.files && req.files.length > 0) await Promise.all(req.files.map(async file => await fs.promises.unlink(file.path)));
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
