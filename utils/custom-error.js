class CustomError extends Error {
  constructor(message, statusCode, validationErrors = []) {
    super(message);
    this.statusCode = statusCode;
    this.validationErrors = validationErrors;
  }
}

module.exports = CustomError;
