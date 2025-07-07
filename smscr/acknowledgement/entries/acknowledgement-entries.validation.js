const { body, param } = require("express-validator");
const ChartOfAccount = require("../../chart-of-account/chart-of-account.schema.js");
const AcknowledgementEntry = require("./acknowledgement-entries.schema.js");
const Entry = require("../../transactions/entries/entry.schema.js");

exports.acknowledgementEntryIdRules = [
  param("entryId")
    .trim()
    .notEmpty()
    .withMessage("Entry id is required")
    .isMongoId()
    .withMessage("Invalid entry id")
    .custom(async (value, { req }) => {
      const acknowledgementId = req.params.id;
      const exists = await AcknowledgementEntry.exists({ _id: value, acknowledgement: acknowledgementId, deletedAt: null });
      if (!exists) throw new Error("Entry not found");
      return true;
    }),
];

exports.acknowledgementEntryRules = [
  body("particular").if(body("particular").notEmpty()).isLength({ min: 1, max: 255 }).withMessage("Particular must only contain 1 to 255 characters"),
  body("cvNo")
    .if(body("cvNo").notEmpty())
    .custom(async (value, { req }) => {
      const loanReleaseEntryId = req.body.loanReleaseEntryId;
      const exists = await Entry.exists({ _id: loanReleaseEntryId, deletedAt: null });
      if (!exists) throw new Error("CV No. not found / deleted");
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
