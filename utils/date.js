const moment = require("moment");

exports.completeNumberDate = date => {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const year = date.getFullYear();
  return `${month}/${day}/${year}`;
};

exports.validateDateInput = date => {
  if (!moment(date, "YYYY-MM-DD", true).isValid()) {
    return "";
  }
  return date;
};
