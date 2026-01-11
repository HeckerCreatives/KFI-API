const { param, body, query } = require("express-validator");
const Bank = require("../banks/bank.schema.js");
const { isValidObjectId, default: mongoose } = require("mongoose");
const ChartOfAccount = require("../chart-of-account/chart-of-account.schema.js");
const Acknowledgement = require("./release.schema.js");
const { isCodeUnique } = require("../../utils/code-checker.js");
const Entry = require("../transactions/entries/entry.schema.js");
const Center = require("../center/center.schema.js");
const Release = require("./release.schema.js");
const ReleaseEntry = require("./entries/release-entries.schema.js");
const { hasBankEntry } = require("../../utils/bank-entry-checker.js");
const { hasDuplicateLines } = require("../../utils/line-duplicate-checker.js");
const { isAmountTally } = require("../../utils/tally-amount.js");
const { types, categories } = require("../../constants/aror-load-entry.js");
const PaymentSchedule = require("../payment-schedules/payment-schedule.schema.js");
const Transaction = require("../transactions/transaction.schema.js");
const { loanTypes } = require("../../constants/loan-types.js");

exports.loadEntryRules = [
  query("dueDateId")
    .trim()
    .notEmpty()
    .withMessage("Due date id is required")
    .isMongoId()
    .withMessage("Invalid due date id")
    .bail()
    .custom(async value => {
      const exists = await PaymentSchedule.exists({ _id: value, deletedAt: null }).exec();
      if (!exists) throw new Error("Due date not found");
      return true;
    }),
  query("center")
    .trim()
    .notEmpty()
    .withMessage("Center id is required")
    .isMongoId()
    .withMessage("Invalid center id")
    .bail()
    .custom(async value => {
      const exists = await Center.exists({ _id: value, deletedAt: null }).exec();
      if (!exists) throw new Error("Center not found");
      return true;
    }),
  query("type")
    .trim()
    .notEmpty()
    .withMessage("Type is required")
    .bail()
    .custom(value => {
      if (!types.includes(value)) throw Error("Invalid type");
      return true;
    }),
  query("category")
    .trim()
    .notEmpty()
    .withMessage("Category is required")
    .bail()
    .custom(value => {
      if (!categories.includes(value)) throw Error("Invalid category");
      return true;
    }),
];

exports.releaseIdRules = [
  param("id")
    .trim()
    .notEmpty()
    .withMessage("Acknowledgement id is required")
    .isMongoId()
    .withMessage("Invalid acknowledgement id")
    .custom(async value => {
      const exists = await Release.exists({ _id: value, deletedAt: null });
      if (!exists) throw new Error("Acknowledgement not found");
      return true;
    }),
];

exports.releaseRules = [
  body("code")
    .trim()
    .notEmpty()
    .withMessage("AR No is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("AR No must only consist of 1 to 255 characters")
    .custom(async value => {
      const isUnique = await isCodeUnique(value);
      if (!isUnique) throw new Error("AR No. already exists");
      return true;
    })
    .matches(/^AR#[\d-]+$/i)
    .withMessage("AR# must start with AR# followed by numbers or hyphens"),
  ,
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
  body("checkNo")
    .if(body("checkNo").notEmpty())
    .trim()
    .notEmpty()
    .withMessage("Check no. is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Check no. must only consist of 1 to 255 characters"),
  body("checkDate")
    .trim()
    .notEmpty()
    .withMessage("Check date is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Check date must only consist of 1 to 255 characters")
    .isDate({ format: "YYYY-MM-DD" })
    .withMessage("Check date must be a valid date (YYYY-MM-DD)")
    .custom((value, { req }) => {
      const date = req.body.date;
      const checkDate = value;
      if (date !== checkDate) throw Error("Date and Check Date must be the same");
      return true;
    }),
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
  body("entries.*.line")
    .trim()
    .notEmpty()
    .withMessage("Line is required")
    .isNumeric()
    .withMessage("Line must be a number")
    .isFloat({ min: 1 })
    .withMessage("1 is the minimum for Line"),
  body("entries.*.week")
    .if(body("entries.*.week").notEmpty())
    .trim()
    .notEmpty()
    .withMessage("Week is required")
    .isNumeric()
    .withMessage("Week must be a number")
    .isFloat({ min: 1 })
    .withMessage("1 is the minimum for Week"),
  body("entries.*.cvNo")
    .if(body("entries.*.cvNo").notEmpty())
    .trim()
    .notEmpty()
    .withMessage("CV# is required")
    .custom(async (value, { req, path }) => {
      const index = path.match(/entries\[(\d+)\]\.cvNo/)[1];
      const entries = req.body.entries;
      if (!Array.isArray(entries)) throw new Error("Invalid entries");
      const loanReleaseId = entries[index].loanReleaseId;
      const exists = await Transaction.exists({ _id: loanReleaseId, deletedAt: null });
      if (!exists) throw new Error("CV# not found / deleted");
      return true;
    }),
  body("entries.*.dueDate")
    .if(body("entries.*.dueDate").notEmpty())
    .trim()
    .notEmpty()
    .withMessage("Due Date is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Due Date must only consist of 1 to 255 characters")
    .isDate({ format: "YYYY-MM-DD" })
    .withMessage("Due Date must be a valid date (YYYY-MM-DD)"),
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
  body("entries.*.type")
    .trim()
    .notEmpty()
    .withMessage("Type is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Type must only consist of 1 to 255 characters")
    .custom(value => {
      if (!loanTypes.includes(value)) throw Error("Invalid loan type");
      return true;
    }),
  body("root").custom(async (value, { req }) => {
    const entries = req.body.entries;
    const amount = Number(req.body.amount);

    const haveBankEntry = await hasBankEntry(entries);
    if (!haveBankEntry) throw new Error("Bank entry is required");

    if (hasDuplicateLines(entries)) throw new Error("Make sure there is no duplicate line no.");

    const { debitCreditBalanced, netDebitCreditBalanced, netAmountBalanced } = isAmountTally(entries, amount);
    if (!debitCreditBalanced) throw new Error("Debit and Credit must be balanced.");
    if (!netDebitCreditBalanced) throw new Error("Please check all the amount in the entries");
    if (!netAmountBalanced) throw new Error("Amount and Net Amount must be balanced");

    return true;
  }),
];

exports.updateReleaseRules = [
  body("code")
    .trim()
    .notEmpty()
    .withMessage("AR No is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("AR No must only consist of 1 to 255 characters")
    .custom(async (value, { req }) => {
      const release = await Release.findById(req.params.id).lean().exec();
      const newValue = release.code.toUpperCase().startsWith("AR#") ? release.code : `AR#${release.code}`;
      if (newValue.toUpperCase() !== value.toUpperCase()) {
        const isUnique = await isCodeUnique(value);
        if (!isUnique) throw new Error("AR No. already exists");
      }
      return true;
    })
    .matches(/^AR#[\d-]+$/i)
    .withMessage("AR# must start with AR# followed by numbers or hyphens"),
  ,
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
  body("checkNo")
    .if(body("checkNo").notEmpty())
    .trim()
    .notEmpty()
    .withMessage("Check no. is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Check no. must only consist of 1 to 255 characters"),
  body("checkDate")
    .trim()
    .notEmpty()
    .withMessage("Check date is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Check date must only consist of 1 to 255 characters")
    .isDate({ format: "YYYY-MM-DD" })
    .withMessage("Check date must be a valid date (YYYY-MM-DD)")
    .custom((value, { req }) => {
      const date = req.body.date;
      const checkDate = value;
      if (date !== checkDate) throw Error("Date and Check Date must be the same");
      return true;
    }),
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
  body("entries.*.line")
    .trim()
    .notEmpty()
    .withMessage("Line is required")
    .isNumeric()
    .withMessage("Line must be a number")
    .isFloat({ min: 1 })
    .withMessage("1 is the minimum for Line"),
  body("entries.*.week")
    .if(body("entries.*.week").notEmpty())
    .trim()
    .notEmpty()
    .withMessage("Week is required")
    .isNumeric()
    .withMessage("Week must be a number")
    .isFloat({ min: 1 })
    .withMessage("1 is the minimum for Week"),
  body("entries.*.cvNo")
    .if(body("entries.*.cvNo").notEmpty())
    .trim()
    .notEmpty()
    .withMessage("CV# is required")
    .custom(async (value, { req, path }) => {
      const index = path.match(/entries\[(\d+)\]\.cvNo/)[1];
      const entries = req.body.entries;
      if (!Array.isArray(entries)) throw new Error("Invalid entries");
      const loanReleaseId = entries[index].loanReleaseId;
      const exists = await Transaction.exists({ _id: loanReleaseId, deletedAt: null });
      if (!exists) throw new Error("CV# not found / deleted");
      return true;
    }),
  body("entries.*.dueDate")
    .if(body("entries.*.dueDate").notEmpty())
    .trim()
    .notEmpty()
    .withMessage("Due Date is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Due Date must only consist of 1 to 255 characters")
    .isDate({ format: "YYYY-MM-DD" })
    .withMessage("Due Date must be a valid date (YYYY-MM-DD)"),
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
  body("entries.*.type")
    .trim()
    .notEmpty()
    .withMessage("Type is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Type must only consist of 1 to 255 characters")
    .custom(value => {
      if (!loanTypes.includes(value)) throw Error("Invalid loan type");
      return true;
    }),
  body("root").custom(async (value, { req }) => {
    const entries = req.body.entries;
    const amount = Number(req.body.amount);

    const haveBankEntry = await hasBankEntry(entries);
    if (!haveBankEntry) throw new Error("Bank entry is required");

    if (hasDuplicateLines(entries)) throw new Error("Make sure there is no duplicate line no.");

    const { debitCreditBalanced, netDebitCreditBalanced, netAmountBalanced } = isAmountTally(entries, amount);
    if (!debitCreditBalanced) throw new Error("Debit and Credit must be balanced.");
    if (!netDebitCreditBalanced) throw new Error("Please check all the amount in the entries");
    if (!netAmountBalanced) throw new Error("Amount and Net Amount must be balanced");

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

      const deletedIds = await ReleaseEntry.countDocuments({ _id: { $in: value } }).exec();
      if (deletedIds !== value.length) {
        throw new Error("Please check all the deleted values");
      }

      return true;
    }),
];
