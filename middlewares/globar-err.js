const globalErrorHandler = (err, req, res, next) => {
  const error = {
    message: "Internal Error",
  };

  if (err.statusCode) {
    error.message = err.message;

    res.status(err.statusCode);
  } else {
    res.status(500);
  }

  if (err.validationErrors && err.validationErrors.length > 0) {
    error.formErrors = err.validationErrors;
  }

  if (process.env.NODE_ENV === "development") {
    error.stack = err.stack;
  }

  res.json({ error });
};

module.exports = globalErrorHandler;
