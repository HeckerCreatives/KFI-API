const { query } = require("express-validator");
const ChartOfAccount = require("../chart-of-account/chart-of-account.schema");
const BeginningBalance = require("../beginning-balance/beginning-balance.schema");

exports.activityReportRules = [
  query("dateFrom").trim().notEmpty().withMessage("Date from is required.").isDate({ format: "YYYY-MM-DD" }).withMessage("Date from must be a valid date (YYYY-MM-DD)"),
  query("dateTo")
    .trim()
    .notEmpty()
    .withMessage("Date to is required.")
    .isDate({ format: "YYYY-MM-DD" })
    .withMessage("Date to must be a valid date (YYYY-MM-DD)")
    .custom((value, { req }) => {
      const dateFrom = new Date(req.query.dateFrom);
      const dateTo = new Date(value);
      if (dateTo <= dateFrom) {
        throw new Error("Date to must be after or equal date from");
      }
      return true;
    }),
  query("codeFrom")
    .trim()
    .notEmpty()
    .withMessage("Code from is required.")
    .custom(async value => {
      const exists = await ChartOfAccount.exists({ code: value }).exec();
      if (!exists) throw new Error("Code from not found");
      return true;
    }),
  query("codeTo")
    .trim()
    .notEmpty()
    .withMessage("Code  to is required.")
    .custom(async value => {
      const exists = await ChartOfAccount.exists({ code: value }).exec();
      if (!exists) throw new Error("Code to not found");
      return true;
    })
    .custom((value, { req }) => {
      const codeFrom = req.query.codeFrom;
      if (value.localeCompare(codeFrom) < 0) {
        throw new Error("Code to must be greater than or equal to code from");
      }
      return true;
    }),
  query("withBeginningBalance").isBoolean().withMessage("Invalid With Beginning Balance"),
  query("year")
    .if(query("withBeginningBalance").custom(value => value === "true"))
    .trim()
    .notEmpty()
    .withMessage("Year is required")
    .isNumeric()
    .withMessage("Year must be a number")
    .custom(async value => {
      const exists = await BeginningBalance.findOne({ year: value, deletedAt: null }).exec();
      if (!exists) throw new Error("Beginning balance with this year does not exists / deleted.");
      return false;
    }),
];

exports.auditTrailReportRules = [
  query("dateFrom").trim().notEmpty().withMessage("Date from is required.").isDate({ format: "YYYY-MM-DD" }).withMessage("Date from must be a valid date (YYYY-MM-DD)"),
  query("dateTo")
    .trim()
    .notEmpty()
    .withMessage("Date to is required.")
    .isDate({ format: "YYYY-MM-DD" })
    .withMessage("Date to must be a valid date (YYYY-MM-DD)")
    .custom((value, { req }) => {
      const dateFrom = new Date(req.query.dateFrom);
      const dateTo = new Date(value);
      if (dateTo <= dateFrom) {
        throw new Error("Date to must be after or equal date from");
      }
      return true;
    }),
  query("codeFrom")
    .trim()
    .notEmpty()
    .withMessage("Code from is required.")
    .custom(async value => {
      const exists = await ChartOfAccount.exists({ code: value }).exec();
      if (!exists) throw new Error("Code from not found");
      return true;
    }),
  query("codeTo")
    .trim()
    .notEmpty()
    .withMessage("Code  to is required.")
    .custom(async value => {
      const exists = await ChartOfAccount.exists({ code: value }).exec();
      if (!exists) throw new Error("Code to not found");
      return true;
    })
    .custom((value, { req }) => {
      const codeFrom = req.query.codeFrom;
      if (value.localeCompare(codeFrom) < 0) {
        throw new Error("Code to must be greater than or equal to code from");
      }
      return true;
    }),
  query("withBeginningBalance").isBoolean().withMessage("Invalid With Beginning Balance"),
  query("year")
    .if(query("withBeginningBalance").custom(value => value === "true"))
    .trim()
    .notEmpty()
    .withMessage("Year is required")
    .isNumeric()
    .withMessage("Year must be a number")
    .custom(async value => {
      const exists = await BeginningBalance.findOne({ year: value, deletedAt: null }).exec();
      if (!exists) throw new Error("Beginning balance with this year does not exists / deleted.");
      return false;
    }),
];
