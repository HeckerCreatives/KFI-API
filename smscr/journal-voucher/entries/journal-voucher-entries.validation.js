const { body, param } = require("express-validator");
const ChartOfAccount = require("../../chart-of-account/chart-of-account.schema.js");
const JournalVoucherEntry = require("./journal-voucher-entries.schema");

exports.journalVoucherEntryIdRules = [
  param("entryId")
    .trim()
    .notEmpty()
    .withMessage("Entry id is required")
    .isMongoId()
    .withMessage("Invalid entry id")
    .custom(async (value, { req }) => {
      const journalVoucherId = req.params.id;
      const exists = await JournalVoucherEntry.exists({ _id: value, journalVoucher: journalVoucherId, deletedAt: null });
      if (!exists) throw new Error("Entry not found");
      return true;
    }),
];

exports.journalVoucherEntryRules = [
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
