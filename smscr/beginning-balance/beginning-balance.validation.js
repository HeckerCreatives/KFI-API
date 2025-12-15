const { query, body, param } = require("express-validator");
const ChartOfAccount = require("../chart-of-account/chart-of-account.schema");
const CustomError = require("../../utils/custom-error");
const { hasDuplicateLines } = require("../../utils/line-duplicate-checker");
const BeginningBalance = require("./beginning-balance.schema");
const { default: mongoose } = require("mongoose");
const BeginningBalanceEntry = require("./beginning-balance-entries.schema");

exports.beginningBalanceAccountCodeRules = [
  query("year").trim().notEmpty().withMessage("Year is required").isNumeric().withMessage("Year must be a number"),
  query("withAmount")
    .notEmpty()
    .withMessage("With Amount is required")
    .isBoolean()
    .withMessage("With Amount must be boolean")
    .custom(value => {
      if (!["true", "false"].includes(value)) throw new Error("Invalid with amount value");
      return true;
    }),
];

exports.beginningBalanceAccountCodeByYearRules = [
  param("year")
    .trim()
    .notEmpty()
    .withMessage("Year is required")
    .isNumeric()
    .withMessage("Year must be a number")
    .custom(async value => {
      const exists = await BeginningBalance.exists({ year: value, deletedAt: null }).exec();
      if (!exists) throw new Error("Beginning balance with this year is not found or already deleted.");
      return true;
    }),
];

exports.beginningBalanceIdRules = [
  param("id")
    .trim()
    .notEmpty()
    .withMessage("Beginning balance id is required")
    .isMongoId()
    .withMessage("Invalid beginning balance id")
    .custom(async value => {
      const exists = await BeginningBalance.exists({ _id: value, deletedAt: null }).exec();
      if (!exists) throw new Error("Beginning balance not found or already deleted.");
      return true;
    }),
];

exports.beginningBalanceRules = [
  body("year")
    .trim()
    .notEmpty()
    .withMessage("Year is required")
    .isNumeric()
    .withMessage("Year must be a number")
    .custom(async (value, { req }) => {
      if (req.params.id) {
        const beginningBalance = await BeginningBalance.findById(req.params.id).lean().exec();
        if (beginningBalance.year !== parseInt(value)) {
          const exists = await BeginningBalance.exists({ year: value, deletedAt: null }).exec();
          if (exists) throw new Error("Beginning balance with this year already exists.");
          return true;
        }
        return true;
      } else {
        const exists = await BeginningBalance.exists({ year: value, deletedAt: null }).exec();
        if (exists) throw new Error("Beginning balance with this year already exists.");
        return true;
      }
    }),
  body("memo").if(body("memo").notEmpty()).isLength({ min: 1, max: 500 }).withMessage("Memo can only consist of 1 to 500 characters"),
  body("entries")
    .isArray()
    .withMessage("Entries must be an array.")
    .custom(value => {
      if (!Array.isArray(value)) throw new Error("Entries must be an array");
      if (value.length < 1) throw new Error("Entries must be atleast 1");
      return true;
    }),
  body("entries.*.line").trim().notEmpty().withMessage("Line is required").isNumeric().withMessage("Line must be a number"),
  body("entries.*.acctCodeId")
    .trim()
    .notEmpty()
    .withMessage("Account code id is required")
    .isMongoId()
    .withMessage("Invalid account code id")
    .custom(async value => {
      const exists = await ChartOfAccount.exists({ _id: value }).exec();
      if (!exists) throw new CustomError("Account code not found.");
      return true;
    }),
  body("entries.*.debit")
    .trim()
    .notEmpty()
    .withMessage("Debit is required")
    .isNumeric()
    .withMessage("Debit must be a number")
    .isFloat({ min: 0 })
    .withMessage("Debit cannot be negative"),
  body("entries.*.credit")
    .trim()
    .notEmpty()
    .withMessage("Credit is required")
    .isNumeric()
    .withMessage("Credit must be a number")
    .isFloat({ min: 0 })
    .withMessage("Credit cannot be negative"),
  body("root").custom((value, { req }) => {
    const entries = req.body.entries;
    if (hasDuplicateLines(entries)) throw new Error("Make sure there is no duplicate line no.");
    return true;
  }),
  body("deletedIds")
    .if(body("deletedIds").notEmpty())
    .if(body("deletedIds").isArray())
    .isArray()
    .withMessage("Invalid deleted ids")
    .custom(async value => {
      if (!Array.isArray(value)) throw new Error("Invalid entry ids");

      const validIds = value.filter(id => mongoose.Types.ObjectId.isValid(id));
      if (validIds.length !== value.length) throw new Error("Invalid beginning balance entry id format detected");

      const deletedIds = await BeginningBalanceEntry.countDocuments({ _id: { $in: value }, deletedAt: null }).exec();
      if (deletedIds !== value.length) throw new Error("Please check all the deleted values");

      return true;
    }),
];
