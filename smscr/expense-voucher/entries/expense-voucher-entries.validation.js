const { body, param } = require("express-validator");
const ChartOfAccount = require("../../chart-of-account/chart-of-account.schema.js");
const ExpenseVoucherEntry = require("./expense-voucher-entries.schema.js");
const Customer = require("../../customer/customer.schema.js");

exports.expenseVoucherEntryIdRules = [
  param("entryId")
    .trim()
    .notEmpty()
    .withMessage("Entry id is required")
    .isMongoId()
    .withMessage("Invalid entry id")
    .custom(async (value, { req }) => {
      const expenseVoucherId = req.params.id;
      const exists = await ExpenseVoucherEntry.exists({ _id: value, expenseVoucher: expenseVoucherId, deletedAt: null });
      if (!exists) throw new Error("Entry not found");
      return true;
    }),
];

exports.expenseVoucherEntryRules = [
  body("clientLabel")
    .if(body("clientLabel").notEmpty())
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Name must only contain 1 to 255 characters")
    .custom(async (value, { req, path }) => {
      const clientId = req.body.client;
      const exists = await Customer.exists({ _id: clientId, deletedAt: null });
      if (!exists) throw new Error("Client not found / deleted");
      return true;
    }),
  body("particular").if(body("particular").notEmpty()).isLength({ min: 1, max: 255 }).withMessage("Particular must only contain 1 to 255 characters"),
  body("acctCode")
    .trim()
    .notEmpty()
    .withMessage("Account code is required")
    .custom(async (value, { req }) => {
      const acctCodeId = req.body.acctCodeId;
      const exists = await ChartOfAccount.exists({ _id: acctCodeId, deletedAt: null });
      if (!exists) throw new Error("Account code not found / deleted");
      return true;
    }),
  body("debit").if(body("debit").notEmpty()).isNumeric().withMessage("Debit must be a number"),
  body("credit").if(body("credit").notEmpty()).isNumeric().withMessage("Credit must be a number"),
  body("cvForRecompute").if(body("cvForRecompute").notEmpty()).isLength({ min: 1, max: 255 }).withMessage("CV for recompute must only contain 1 to 255 characters"),
];
