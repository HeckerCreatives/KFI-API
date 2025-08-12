const { param, body } = require("express-validator");
const Loan = require("./loan.schema.js");
const ChartOfAccount = require("../chart-of-account/chart-of-account.schema.js");
const LoanCode = require("../loan-code/loan-code.schema.js");

exports.loanProductIdRules = [
  param("id")
    .trim()
    .notEmpty()
    .withMessage("Loan id is required")
    .isMongoId()
    .withMessage("Invalid loan id")
    .custom(async value => {
      const exists = await Loan.exists({ _id: value, deletedAt: null });
      if (!exists) throw new Error("Loan code not found");
      return true;
    }),
];

exports.loanCodeIdRules = [
  param("id")
    .trim()
    .notEmpty()
    .withMessage("Loan code id is required")
    .isMongoId()
    .withMessage("Invalid loan code id")
    .custom(async value => {
      const exists = await LoanCode.exists({ _id: value, deletedAt: null });
      if (!exists) throw new Error("Loan code not found");
      return true;
    }),
];

exports.loanProductRules = [
  body("code")
    .trim()
    .notEmpty()
    .withMessage("Code is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Code must only consist of 1 to 255 characters")
    .custom(async (value, { req }) => {
      const exists = await Loan.exists({ code: value.toUpperCase(), deletedAt: null });
      if (exists) throw new Error("Loan code already exists");

      const { loanCodes } = req.body;
      if (!loanCodes) throw new Error("Atlease 1 loan code is required");
      if (!Array.isArray(loanCodes)) throw new Error("Invalid loan codes");
      if (loanCodes.length < 1) throw new Error("Atleast 1 loan code is required");

      return true;
    }),
  body("description").if(body("description").notEmpty()).trim().isLength({ min: 1, max: 255 }).withMessage("Description must only consist of 1 to 255 characters"),
  body("loanCodes").isArray({ min: 1 }).withMessage("At least one loan code is required per module"),
  body("loanCodes.*.module").notEmpty().withMessage("Module name is required"),
  body("loanCodes.*.loanType").notEmpty().withMessage("Loan type is required"),
  body("loanCodes.*.acctCode")
    .trim()
    .notEmpty()
    .withMessage("Account code is required")
    .isMongoId()
    .withMessage("Invalid account code")
    .custom(async value => {
      const exists = await ChartOfAccount.exists({ _id: value, deletedAt: null });
      if (!exists) throw new Error("Invalid account code");
      return true;
    }),
  body("loanCodes.*.sortOrder").isInt({ min: 1 }).withMessage("Sort order must be a positive integer"),
];

exports.loanCodeRules = [
  body("loan")
    .trim()
    .notEmpty()
    .withMessage("Loan product id is required")
    .isMongoId()
    .withMessage("Invalid loan product id")
    .custom(async value => {
      const exists = await Loan.exists({ _id: value, deletedAt: null });
      if (!exists) throw new Error("Loan product not found");
      return true;
    }),
  body("module").notEmpty().withMessage("Module name is required"),
  body("loanType").notEmpty().withMessage("Loan type is required"),
  body("acctCode")
    .trim()
    .notEmpty()
    .withMessage("Account code is required")
    .isMongoId()
    .withMessage("Invalid account code")
    .custom(async value => {
      const exists = await ChartOfAccount.exists({ _id: value, deletedAt: null });
      if (!exists) throw new Error("Invalid account code");
      return true;
    }),
  body("sortOrder").isInt({ min: 1 }).withMessage("Sort order must be a positive integer"),
];

exports.updateLoanProductRules = [
  body("code")
    .trim()
    .notEmpty()
    .withMessage("Code is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Code must only consist of 1 to 255 characters")
    .custom(async (value, { req }) => {
      const center = await Loan.findById(req.params.id).lean().exec();
      if (center.code.toLowerCase() !== value.toLowerCase()) {
        const exists = await Loan.exists({ code: value.toUpperCase(), deletedAt: null });
        if (exists) throw new Error("Loan code already exists");
      }
      return true;
    }),
];
