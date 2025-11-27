const CustomError = require("./custom-error");
const { isValidDate } = require("./date");

exports.validateSyncDates = (dateFrom, dateTo) => {
  if (!dateFrom) throw new CustomError("Date From is required", 400);
  if (!dateTo) throw new CustomError("Date To is required", 400);

  if (!isValidDate(dateFrom)) throw new CustomError("Invalid date from", 400);
  if (!isValidDate(dateTo)) throw new CustomError("Invalid date to", 400);

  const from = new Date(dateFrom);
  const to = new Date(dateTo);

  if (to <= from) throw new CustomError("Date To must be after Date From", 400);

  const diffTime = Math.abs(to - from);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays > 14) throw new CustomError("Date range cannot exceed 2 weeks", 400);
};
