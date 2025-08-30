const { param, body } = require("express-validator");
const ExpenseVoucher = require("../expense-voucher/expense-voucher.schema.js");
const Supplier = require("../supplier/supplier.schema");
const Bank = require("../banks/bank.schema");
const Transaction = require("../transactions/transaction.schema");
const { isValidObjectId, default: mongoose } = require("mongoose");
const ChartOfAccount = require("../chart-of-account/chart-of-account.schema.js");
const JournalVoucher = require("../journal-voucher/journal-voucher.schema.js");
const EmergencyLoan = require("../emergency-loan/emergency-loan.schema.js");
const DamayanFund = require("../damayan-fund/damayan-fund.schema.js");
const Acknowledgement = require("./acknowlegement.schema.js");
const { isCodeUnique } = require("../../utils/code-checker.js");
const Entry = require("../transactions/entries/entry.schema.js");
const Center = require("../center/center.schema.js");
const ExpenseVoucherEntry = require("../expense-voucher/entries/expense-voucher-entries.schema.js");
const AcknowledgementEntry = require("./entries/acknowledgement-entries.schema.js");

exports.acknowledgementIdRules = [
  param("id")
    .trim()
    .notEmpty()
    .withMessage("Acknowledgement id is required")
    .isMongoId()
    .withMessage("Invalid acknowledgement id")
    .custom(async value => {
      const exists = await Acknowledgement.exists({ _id: value, deletedAt: null });
      if (!exists) throw new Error("Acknowledgement not found");
      return true;
    }),
];

exports.acknowledgementRules = [
  body("code")
    .trim()
    .notEmpty()
    .withMessage("OR No is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("OR No must only consist of 1 to 255 characters")
    .custom(async value => {
      const isUnique = await isCodeUnique(value);
      if (!isUnique) throw new Error("OR No. already exists");
      return true;
    })
    .matches(/^OR#[\d-]+$/i)
    .withMessage("OR# must start with OR# followed by numbers or hyphens"),
  body("centerLabel")
    .trim()
    .notEmpty()
    .withMessage("Center is required")
    .custom(async (value, { req }) => {
      const centerId = req.body.center;
      if (!isValidObjectId(centerId)) throw new Error("Invalid center");
      const exists = await Center.exists({ _id: centerId, deletedAt: null });
      if (!exists) throw new Error("Center not found");
      return true;
    }),
  body("refNo").if(body("refNo").notEmpty()).isLength({ min: 1, max: 255 }).withMessage("Reference No. must only consist of 1 to 255 characters"),
  body("remarks").if(body("remarks").notEmpty()).isLength({ min: 1, max: 255 }).withMessage("Particular must only consist of 1 to 255 characters"),
  body("type").trim().notEmpty().withMessage("Cash type is required").isLength({ min: 1, max: 255 }).withMessage("Cash type must only consist of 1 to 255 characters"),
  body("acctOfficer")
    .trim()
    .notEmpty()
    .withMessage("Account officer is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Account officer must only consist of 1 to 255 characters"),
  body("date")
    .trim()
    .notEmpty()
    .withMessage("Date is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Date must only consist of 1 to 255 characters")
    .isDate({ format: "YYYY-MM-DD" })
    .withMessage("Date must be a valid date (YYYY-MM-DD)"),
  body("acctMonth").trim().notEmpty().withMessage("Account Month is required").isNumeric().withMessage("Account Month must be a number"),
  body("acctYear").trim().notEmpty().withMessage("Account Year is required").isNumeric().withMessage("Account Year must be a number"),
  body("checkNo").trim().notEmpty().withMessage("Check no. is required").isLength({ min: 1, max: 255 }).withMessage("Check no. must only consist of 1 to 255 characters"),
  body("checkDate")
    .trim()
    .notEmpty()
    .withMessage("Check date is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Check date must only consist of 1 to 255 characters")
    .isDate({ format: "YYYY-MM-DD" })
    .withMessage("Check date must be a valid date (YYYY-MM-DD)"),
  body("bankCodeLabel")
    .trim()
    .notEmpty()
    .withMessage("Bank code is required")
    .custom(async (value, { req }) => {
      const bankId = req.body.bankCode;
      if (!isValidObjectId(bankId)) throw new Error("Invalid bank code id");
      const exists = await Bank.exists({ _id: bankId, deletedAt: null });
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
  body("cashCollection")
    .if(body("cashCollection").notEmpty())
    .trim()
    .notEmpty()
    .withMessage("Amount is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Amount must only consist of 1 to 255 characters")
    .isNumeric()
    .withMessage("Amount must be a number"),
  body("entries")
    .isArray()
    .withMessage("Entries must be an array")
    .custom(value => {
      if (!Array.isArray(value)) throw new Error("Invalid entries");
      if (value.length < 1) throw new Error("Atleast 1 entry is required");
      return true;
    }),
  body("entries.*.cvNo")
    .if(body("entries.*.cvNo").notEmpty())
    .trim()
    .notEmpty()
    .withMessage("CV# is required")
    .custom(async (value, { req, path }) => {
      const index = path.match(/entries\[(\d+)\]\.cvNo/)[1];
      const entries = req.body.entries;
      if (!Array.isArray(entries)) throw new Error("Invalid entries");
      const entryId = entries[index].loanReleaseEntryId;
      const exists = await Entry.exists({ _id: entryId, deletedAt: null });
      if (!exists) throw new Error("CV# not found / deleted");
      return true;
    }),
  body("entries.*.particular").if(body("entries.*.particular").notEmpty()).isLength({ min: 1, max: 255 }).withMessage("Particular must only contain 1 to 255 characters"),
  body("entries.*.acctCode")
    .trim()
    .notEmpty()
    .withMessage("Account code is required")
    .custom(async (value, { req, path }) => {
      const index = path.match(/entries\[(\d+)\]\.acctCode/)[1];
      const entries = req.body.entries;
      if (!Array.isArray(entries)) throw new Error("Invalid entries");
      const acctCodeId = entries[index].acctCodeId;
      const exists = await ChartOfAccount.exists({ _id: acctCodeId, deletedAt: null });
      if (!exists) throw new Error("Account code not found / deleted");
      return true;
    }),
  body("entries.*.debit").if(body("entries.*.debit").notEmpty()).isNumeric().withMessage("Debit must be a number"),
  body("entries.*.credit").if(body("entries.*.credit").notEmpty()).isNumeric().withMessage("Credit must be a number"),
];

exports.updateAcknowledgementRules = [
  body("code")
    .trim()
    .notEmpty()
    .withMessage("OR No is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("OR No must only consist of 1 to 255 characters")
    .custom(async (value, { req }) => {
      const acknowledgement = await Acknowledgement.findById(req.params.id).lean().exec();
      const newValue = acknowledgement.code.toUpperCase().startsWith("OR#") ? acknowledgement.code : `OR#${acknowledgement.code}`;
      if (newValue.toUpperCase() !== value.toUpperCase()) {
        const isUnique = await isCodeUnique(value);
        if (!isUnique) throw new Error("OR No. already exists");
      }
      return true;
    })
    .matches(/^OR#[\d-]+$/i)
    .withMessage("OR# must start with OR# followed by numbers or hyphens"),
  body("centerLabel")
    .trim()
    .notEmpty()
    .withMessage("Center is required")
    .custom(async (value, { req }) => {
      const centerId = req.body.center;
      if (!isValidObjectId(centerId)) throw new Error("Invalid center");
      const exists = await Center.exists({ _id: centerId, deletedAt: null });
      if (!exists) throw new Error("Center not found");
      return true;
    }),
  body("refNo").if(body("refNo").notEmpty()).isLength({ min: 1, max: 255 }).withMessage("Reference No. must only consist of 1 to 255 characters"),
  body("remarks").if(body("remarks").notEmpty()).isLength({ min: 1, max: 255 }).withMessage("Particular must only consist of 1 to 255 characters"),
  body("type").trim().notEmpty().withMessage("Cash type is required").isLength({ min: 1, max: 255 }).withMessage("Cash type must only consist of 1 to 255 characters"),
  body("acctOfficer")
    .trim()
    .notEmpty()
    .withMessage("Account officer is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Account officer must only consist of 1 to 255 characters"),
  body("date")
    .trim()
    .notEmpty()
    .withMessage("Date is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Date must only consist of 1 to 255 characters")
    .isDate({ format: "YYYY-MM-DD" })
    .withMessage("Date must be a valid date (YYYY-MM-DD)"),
  body("acctMonth").trim().notEmpty().withMessage("Account Month is required").isNumeric().withMessage("Account Month must be a number"),
  body("acctYear").trim().notEmpty().withMessage("Account Year is required").isNumeric().withMessage("Account Year must be a number"),
  body("checkNo").trim().notEmpty().withMessage("Check no. is required").isLength({ min: 1, max: 255 }).withMessage("Check no. must only consist of 1 to 255 characters"),
  body("checkDate")
    .trim()
    .notEmpty()
    .withMessage("Check date is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Check date must only consist of 1 to 255 characters")
    .isDate({ format: "YYYY-MM-DD" })
    .withMessage("Check date must be a valid date (YYYY-MM-DD)"),
  body("bankCodeLabel")
    .trim()
    .notEmpty()
    .withMessage("Bank code is required")
    .custom(async (value, { req }) => {
      const bankId = req.body.bankCode;
      if (!isValidObjectId(bankId)) throw new Error("Invalid bank code id");
      const exists = await Bank.exists({ _id: bankId, deletedAt: null });
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
  body("cashCollection")
    .if(body("cashCollection").notEmpty())
    .trim()
    .notEmpty()
    .withMessage("Amount is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Amount must only consist of 1 to 255 characters")
    .isNumeric()
    .withMessage("Amount must be a number"),
  body("entries")
    .isArray()
    .withMessage("Entries must be an array")
    .custom(value => {
      if (!Array.isArray(value)) throw new Error("Invalid entries");
      if (value.length < 1) throw new Error("Atleast 1 entry is required");
      return true;
    }),
  body("entries.*.cvNo")
    .if(body("entries.*.cvNo").notEmpty())
    .trim()
    .notEmpty()
    .withMessage("CV# is required")
    .custom(async (value, { req, path }) => {
      const index = path.match(/entries\[(\d+)\]\.cvNo/)[1];
      const entries = req.body.entries;
      if (!Array.isArray(entries)) throw new Error("Invalid entries");
      const entryId = entries[index].loanReleaseEntryId;
      const exists = await Entry.exists({ _id: entryId, deletedAt: null });
      if (!exists) throw new Error("CV# not found / deleted");
      return true;
    }),
  body("entries.*.particular").if(body("entries.*.particular").notEmpty()).isLength({ min: 1, max: 255 }).withMessage("Particular must only contain 1 to 255 characters"),
  body("entries.*.acctCode")
    .trim()
    .notEmpty()
    .withMessage("Account code is required")
    .custom(async (value, { req, path }) => {
      const index = path.match(/entries\[(\d+)\]\.acctCode/)[1];
      const entries = req.body.entries;
      if (!Array.isArray(entries)) throw new Error("Invalid entries");
      const acctCodeId = entries[index].acctCodeId;
      const exists = await ChartOfAccount.exists({ _id: acctCodeId, deletedAt: null });
      if (!exists) throw new Error("Account code not found / deleted");
      return true;
    }),
  body("entries.*.debit").if(body("entries.*.debit").notEmpty()).isNumeric().withMessage("Debit must be a number"),
  body("entries.*.credit").if(body("entries.*.credit").notEmpty()).isNumeric().withMessage("Credit must be a number"),
  body("root").custom((value, { req }) => {
    const entries = req.body.entries;
    const amount = Number(req.body.amount);

    let totalDebit = 0;
    let totalCredit = 0;

    entries.map(entry => {
      totalDebit += Number(entry.debit);
      totalCredit += Number(entry.credit);
    });

    if (totalDebit !== totalCredit) throw new Error("Debit and Credit must be balanced.");
    if (totalCredit !== amount) throw new Error("Total of debit and credit must be balanced with the amount field.");
    return true;
  }),
  body("deletedIds")
    .if(body("deletedIds").notEmpty())
    .isArray()
    .withMessage("Invalid deleted ids")
    .custom(async value => {
      if (!Array.isArray(value)) {
        throw new Error("Invalid entries");
      }

      const validIds = value.filter(id => mongoose.Types.ObjectId.isValid(id));
      if (validIds.length !== value.length) {
        throw new Error("Invalid Id format detected");
      }

      const deletedIds = await AcknowledgementEntry.countDocuments({ _id: { $in: value } }).exec();
      if (deletedIds !== value.length) {
        throw new Error("Please check all the deleted values");
      }

      return true;
    }),
];
