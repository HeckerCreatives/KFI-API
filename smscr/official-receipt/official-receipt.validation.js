const { param, body } = require("express-validator");
const OfficialReceipt = require("./official-receipt.schema");
const Bank = require("../banks/bank.schema");
const Center = require("../center/center.schema");

exports.officialReceiptIdRules = [
  param("id")
    .trim()
    .notEmpty()
    .withMessage("Official receipt id is required")
    .isMongoId()
    .withMessage("Invalid official receipt id")
    .custom(async value => {
      const exists = await OfficialReceipt.exists({ _id: value, deletedAt: null });
      if (!exists) throw new Error("Official Receipt not found");
      return true;
    }),
];

exports.officialReceiptRules = [
  body("orNo").trim().notEmpty().withMessage("OR No is required").isLength({ min: 1, max: 255 }).withMessage("OR No must only consist of 1 to 255 characters"),
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
  body("date")
    .trim()
    .notEmpty()
    .withMessage("Date is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Date must only consist of 1 to 255 characters")
    .isDate({ format: "YYYY-MM-DD" })
    .withMessage("Date must be a valid date (YYYY-MM-DD)"),
  body("acctMonth").trim().notEmpty().withMessage("Account month is required").isLength({ min: 1, max: 255 }).withMessage("Account month must only consist of 1 to 255 characters"),
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
