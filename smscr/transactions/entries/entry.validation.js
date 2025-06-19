const Entry = require("./entry.schema.js");
const { body, param } = require("express-validator");
const { isValidObjectId } = require("mongoose");
const ChartOfAccount = require("../../chart-of-account/chart-of-account.schema");
const Customer = require("../../customer/customer.schema.js");

exports.entryIdRules = [
  param("entryId")
    .trim()
    .notEmpty()
    .withMessage("Entry id is required")
    .isMongoId()
    .withMessage("Invalid entry id")
    .custom(async (value, { req }) => {
      const transactionId = req.params.id;
      const exists = await Entry.exists({ _id: value, transaction: transactionId, deletedAt: null });
      if (!exists) throw new Error("Entry not found");
      return true;
    }),
];

exports.entryRules = [
  body("client")
    .if(body("clientId").notEmpty())
    .custom(async (value, { req }) => {
      const clientId = req.body.clientId;
      if (!clientId) throw new Error("Client is required");
      if (!isValidObjectId(clientId)) throw new Error("Invalid client");
      const exists = await Customer.exists({ _id: clientId, deletedAt: null });
      if (!exists) throw new Error("Client not found");
      return true;
    }),
  body("particular").if(body("particular").notEmpty()).isLength({ min: 1, max: 255 }).withMessage("Particular must only contain 1 to 255 characters"),
  body("acctCode")
    .if(body("acctCodeId").notEmpty())
    .custom(async (value, { req }) => {
      const acctCodeId = req.body.acctCodeId;
      if (!acctCodeId) throw new Error("Account code is required");
      if (!isValidObjectId(acctCodeId)) throw new Error("Invalid account code");
      const exists = await ChartOfAccount.exists({ _id: acctCodeId, deletedAt: null });
      if (!exists) throw new Error("Account code not found");
      return true;
    }),
  body("debit").if(body("debit").notEmpty()).isNumeric().withMessage("Debit must be a number"),
  body("credit").if(body("credit").notEmpty()).isNumeric().withMessage("Credit must be a number"),
  body("interest").if(body("interest").notEmpty()).isNumeric().withMessage("Interest must be a number"),
  body("cycle").if(body("cycle").notEmpty()).isNumeric().withMessage("Cycle must be a number"),
  body("checkNo").if(body("checkNo").notEmpty()).isLength({ min: 1, max: 255 }).withMessage("Check no. must only contain 1 to 255 characters"),
  body("root").custom((value, { req }) => {
    const { credit, debit, checkNo, cycle } = req.body;
    if (debit === "" && credit === "" && checkNo === "" && cycle === "") {
      throw new Error("No data to save. Please fill necessary fields.");
    }
    return true;
  }),
];
