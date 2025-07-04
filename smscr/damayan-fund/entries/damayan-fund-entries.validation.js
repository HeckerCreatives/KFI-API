const { body, param } = require("express-validator");
const ChartOfAccount = require("../../chart-of-account/chart-of-account.schema.js");
const Customer = require("../../customer/customer.schema.js");
const DamayanFundEntry = require("./damayan-fund-entries.schema.js");

exports.damayanFundEntryIdRules = [
  param("entryId")
    .trim()
    .notEmpty()
    .withMessage("Entry id is required")
    .isMongoId()
    .withMessage("Invalid entry id")
    .custom(async (value, { req }) => {
      const damayanFundId = req.params.id;
      const exists = await DamayanFundEntry.exists({ _id: value, damayanFund: damayanFundId, deletedAt: null });
      if (!exists) throw new Error("Entry not found");
      return true;
    }),
];

exports.damayanFundEntryRules = [
  body("particular").if(body("particular").notEmpty()).isLength({ min: 1, max: 255 }).withMessage("Particular must only contain 1 to 255 characters"),
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
];
