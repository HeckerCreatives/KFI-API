const { param, body } = require("express-validator");
const DamayanFund = require("./damayan-fund.schema");
const Supplier = require("../supplier/supplier.schema");
const Bank = require("../banks/bank.schema");
const Nature = require("../nature/nature.schema");

exports.damayanFundIdRules = [
  param("id")
    .trim()
    .notEmpty()
    .withMessage("Damayan fund id is required")
    .isMongoId()
    .withMessage("Invalid damayan fund id")
    .custom(async value => {
      const exists = await DamayanFund.exists({ _id: value, deletedAt: null });
      if (!exists) throw new Error("Damayan Fund not found");
      return true;
    }),
];

exports.damayanFundRules = [
  body("jvNo").trim().notEmpty().withMessage("JV No is required").isLength({ min: 1, max: 255 }).withMessage("JV No must only consist of 1 to 255 characters"),
  body("supplier")
    .trim()
    .notEmpty()
    .withMessage("Supplier is required")
    .isMongoId()
    .withMessage("Invalid supplier id")
    .custom(async value => {
      const exists = await Supplier.exists({ _id: value, deletedAt: null });
      if (!exists) throw new Error("Supplier not found");
      return true;
    }),
  body("nature")
    .trim()
    .notEmpty()
    .withMessage("Nature is required")
    .isMongoId()
    .withMessage("Invalid nature id")
    .custom(async value => {
      const exists = await Nature.exists({ _id: value, deletedAt: null });
      if (!exists) throw new Error("Nature not found");
      return true;
    }),
  body("remarks").trim().notEmpty().withMessage("Remarks is required").isLength({ min: 1, max: 255 }).withMessage("Remarks must only consist of 1 to 255 characters"),
  body("date")
    .trim()
    .notEmpty()
    .withMessage("Date is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Date must only consist of 1 to 255 characters")
    .isDate({ format: "YYYY-MM-DD" })
    .withMessage("Date must be a valid date (YYYY-MM-DD)"),
  body("acctMonth").trim().notEmpty().withMessage("Account month is required").isLength({ min: 1, max: 255 }).withMessage("Account month must only consist of 1 to 255 characters"),
  body("acctYear").trim().notEmpty().withMessage("Account year is required").isLength({ min: 1, max: 255 }).withMessage("Account year must only consist of 1 to 255 characters"),
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
];
