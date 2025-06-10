const { param, body } = require("express-validator");
const LoanRelease = require("./loan-release.schema");
const Center = require("../center/center.schema");
const Loan = require("../loan/loan.schema");
const Bank = require("../banks/bank.schema");

exports.loanReleaseIdRules = [
  param("id")
    .trim()
    .notEmpty()
    .withMessage("Loan release id is required")
    .isMongoId()
    .withMessage("Invalid loan release id")
    .custom(async value => {
      const exists = await LoanRelease.exists({ _id: value, deletedAt: null });
      if (!exists) throw new Error("Loan release not found");
      return true;
    }),
];

exports.loanReleaseRules = [
  body("cvNo").trim().notEmpty().withMessage("CV No is required").isLength({ min: 1, max: 255 }).withMessage("CV No must only consist of 1 to 255 characters"),
  body("center")
    .trim()
    .notEmpty()
    .withMessage("Center is required")
    .isMongoId()
    .withMessage("Invalid center id")
    .custom(async value => {
      const exists = await Center.exists({ _id: value, deletedAt: null });
      if (!exists) throw new Error("Center not found");
      return true;
    }),
  body("name").trim().notEmpty().withMessage("Name is required").isLength({ min: 1, max: 255 }).withMessage("Name must only consist of 1 to 255 characters"),
  body("refNumber")
    .trim()
    .notEmpty()
    .withMessage("Reference number is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Reference number must only consist of 1 to 255 characters"),
  body("date")
    .trim()
    .notEmpty()
    .withMessage("Date is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Date must only consist of 1 to 255 characters")
    .isDate({ format: "YYYY-MM-DD" })
    .withMessage("Date must be a valid date (YYYY-MM-DD)"),
  body("acctMonth")
    .trim()
    .notEmpty()
    .withMessage("Account month is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Account month must only consist of 1 to 255 characters")
    .isNumeric()
    .withMessage("Account month must be a number")
    .custom(value => value >= 1 && value <= 12)
    .withMessage(`No. of weeks must be between 1 and 12`),
  body("noOfWeeks").trim().notEmpty().withMessage("No. of Weeks is required").isLength({ min: 1, max: 255 }).withMessage("No. of weeks must only consist of 1 to 255 characters"),

  body("typeOfLoan")
    .trim()
    .notEmpty()
    .withMessage("Type of loan is required")
    .isMongoId()
    .withMessage("Invalid type of loan id")
    .custom(async value => {
      const exists = await Loan.exists({ _id: value, deletedAt: null });
      if (!exists) throw new Error("Loan not found");
      return true;
    }),
  body("checkNo").trim().notEmpty().withMessage("Check no. is required").isLength({ min: 1, max: 255 }).withMessage("Check no. must only consist of 1 to 255 characters"),
  body("checkDate")
    .trim()
    .notEmpty()
    .withMessage("Check date is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Check date must only consist of 1 to 255 characters")
    .isDate({ format: "YYYY-MM-DD" })
    .withMessage("Check date must be a valid date (YYYY-MM-DD)"),
  body("bankCode")
    .trim()
    .notEmpty()
    .withMessage("Bank code is required")
    .isMongoId()
    .withMessage("Invalid bank code id")
    .custom(async value => {
      const exists = await Bank.exists({ _id: value, deletedAt: null });
      if (!exists) throw new Error("Invalid bank code id");
      return true;
    }),
  body("amount")
    .trim()
    .notEmpty()
    .withMessage("Amount is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Amount must only consist of 1 to 255 characters")
    .isNumeric()
    .withMessage("Amount must be a number"),
  body("cycle").trim().notEmpty().withMessage("Cycle is required").isLength({ min: 1, max: 255 }).withMessage("Cycle must only consist of 1 to 255 characters"),
  body("interestRate")
    .trim()
    .notEmpty()
    .withMessage("Interest rate is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Interest rate must only consist of 1 to 255 characters")
    .isNumeric()
    .withMessage("Interest rate must be a number"),
  body("remarks").trim().notEmpty().withMessage("Remarks is required").isLength({ min: 1, max: 255 }).withMessage("Remarks must only consist of 1 to 255 characters"),
  body("payee").trim().notEmpty().withMessage("Payee is required").isLength({ min: 1, max: 255 }).withMessage("Payee must only consist of 1 to 255 characters"),
];
