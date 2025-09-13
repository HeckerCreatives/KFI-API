const { body, param } = require("express-validator");
const Loan = require("../loan/loan.schema.js");
const Center = require("../center/center.schema.js");
const Customer = require("../customer/customer.schema.js");
const ChartOfAccount = require("../chart-of-account/chart-of-account.schema.js");
const Transaction = require("./transaction.schema.js");
const Bank = require("../banks/bank.schema.js");
const { isCodeUnique } = require("../../utils/code-checker.js");
const Entry = require("./entries/entry.schema.js");
const { default: mongoose } = require("mongoose");
const { hasDuplicateLines } = require("../../utils/line-duplicate-checker.js");
const { hasBankEntry } = require("../../utils/bank-entry-checker.js");
const { isAmountTally } = require("../../utils/tally-amount.js");

exports.printFileRules = [
  param("transaction")
    .trim()
    .notEmpty()
    .withMessage("Transaction id is required")
    .isMongoId()
    .withMessage("Invalid transaction id")
    .custom(async value => {
      const exists = await Transaction.exists({ _id: value, deletedAt: null });
      if (!exists) throw new Error("Transaction not found");
      return true;
    }),
];

exports.transactionIdRules = [
  param("id")
    .trim()
    .notEmpty()
    .withMessage("Transaction id is required")
    .isMongoId()
    .withMessage("Invalid transaction id")
    .custom(async value => {
      const exists = await Transaction.exists({ _id: value, deletedAt: null });
      if (!exists) throw new Error("Transaction not found");
      return true;
    }),
];

exports.entryLoadRules = [
  body("centerLabel")
    .trim()
    .notEmpty()
    .withMessage("Center is required")
    .isMongoId()
    .withMessage("Invalid center")
    .custom(async value => {
      const exists = await Center.exists({ _id: value, deletedAt: null });
      if (!exists) throw new Error("Center not found / deleted");
      return true;
    }),
];

exports.loadEntryRules = [
  body("typeOfLoan")
    .trim()
    .notEmpty()
    .withMessage("Type of loan is required")
    .custom(async value => {
      const exists = await Loan.exists({ _id: value, deletedAt: null });
      if (!exists) throw new Error("Type of loan not found / deleted");
      return true;
    }),
  body("center")
    .trim()
    .notEmpty()
    .withMessage("Center is required")
    .custom(async value => {
      const exists = await Center.exists({ _id: value, deletedAt: null });
      if (!exists) throw new Error("Center not found / deleted");
      return true;
    }),
  body("isEduc").isBoolean().withMessage("Invalid Loan type"),
];

exports.createTransactionRules = [
  body("cvNo")
    .trim()
    .notEmpty()
    .withMessage("CV No. is required")
    .custom(async value => {
      const isUnique = await isCodeUnique(value);
      if (!isUnique) throw new Error("CV No. already exists");
      return true;
    })
    .matches(/^CV#[\d-]+$/i)
    .withMessage("CV# must start with CV# followed by numbers or hyphens"),
  body("center")
    .trim()
    .notEmpty()
    .withMessage("Center code is required")
    .isMongoId()
    .withMessage("Invalid center code")
    .custom(async value => {
      const exists = await Center.exists({ _id: value, deletedAt: null });
      if (!exists) throw new Error("Center not found");
      return true;
    }),
  body("refNumber").if(body("refNumber").notEmpty()).isLength({ min: 1, max: 255 }).withMessage("Reference number must only consist of 1 to 255 characters"),
  body("remarks").if(body("remarks").notEmpty()).isLength({ min: 1, max: 255 }).withMessage("Particular must only consist of 1 to 255 characters"),
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
  body("noOfWeeks").trim().notEmpty().withMessage("No. of weeks is required").isNumeric().withMessage("No. of weeks must be a number"),
  body("typeOfLoan")
    .trim()
    .notEmpty()
    .withMessage("Type of Loan is  required")
    .isMongoId()
    .withMessage("Type of loan is required")
    .custom(async value => {
      const exists = await Loan.exists({ _id: value, deletedAt: null });
      if (!exists) throw new Error("Type of loan not found");
      return true;
    }),
  body("checkNo")
    .if(body("checkNo").notEmpty())
    .trim()
    .notEmpty()
    .withMessage("Check No. is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Check No. must only contain 1 to 255 characters"),
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
  body("bankCode")
    .trim()
    .notEmpty()
    .withMessage("Bank Code is required")
    .isMongoId()
    .withMessage("Invalid bank code")
    .custom(async value => {
      const exists = await Bank.exists({ _id: value, deletedAt: null });
      if (!exists) throw new Error("Bank code not found");
      return true;
    }),
  body("amount").trim().notEmpty().withMessage("Amount is required").isNumeric().withMessage("Amount must be a number"),
  body("cycle")
    .if(body("cycle").notEmpty())
    .trim()
    .notEmpty()
    .withMessage("Cycle is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Cycle must only consist of 1 to 255 characters"),
  body("interestRate").trim().notEmpty().withMessage("Interest rate is required").isNumeric().withMessage("Interest rate must be a number"),
  body("isEduc").isBoolean().withMessage("EDUC must be a boolean"),
  body("entries")
    .isArray()
    .withMessage("Entries must be an array")
    .custom(value => {
      if (!Array.isArray(value)) throw new Error("Invalid entries");
      if (value.length < 1) throw new Error("Atleast 1 entry is required");
      return true;
    }),
  body("entries.*.line").trim().notEmpty().withMessage("Line is required").isNumeric().withMessage("Line must be a number"),
  body("entries.*.clientId")
    .if(body("entries.*.clientId").notEmpty())
    .isMongoId()
    .withMessage("Invalid client id")
    .custom(async value => {
      const exists = await Customer.exists({ _id: value, deletedAt: null });
      if (!exists) throw new Error("Client not found");
      return true;
    }),
  body("entries.*.particular").if(body("entries.*.particular").notEmpty()).isLength({ min: 1, max: 255 }).withMessage("Particular must only contain 1 to 255 characters"),
  body("entries.*.acctCodeId")
    .if(body("entries.*.acctCodeId").notEmpty())
    .isMongoId()
    .withMessage("Invalid account code")
    .custom(async value => {
      const exists = await ChartOfAccount.exists({ _id: value, deletedAt: null });
      if (!exists) throw new Error("Account code not found");
      return true;
    }),
  body("entries.*.debit").if(body("entries.*.debit").notEmpty()).isNumeric().withMessage("Debit must be a number"),
  body("entries.*.credit").if(body("entries.*.credit").notEmpty()).isNumeric().withMessage("Credit must be a number"),
  body("entries.*.interest").if(body("entries.*.interest").notEmpty()).isNumeric().withMessage("Interest must be a number"),
  body("entries.*.cycle").if(body("entries.*.cycle").notEmpty()).isLength({ min: 1, max: 255 }).withMessage("Cycle must only consist of 1 to 255 characters"),
  body("entries.*.checkNo").if(body("entries.*.checkNo").notEmpty()).isLength({ min: 1, max: 255 }).withMessage("Check no. must only contain 1 to 255 characters"),
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

exports.updateTransactionRules = [
  body("amount").trim().notEmpty().withMessage("Amount is required").isNumeric().withMessage("Amount must be a number"),
  body("cycle")
    .if(body("cycle").notEmpty())
    .trim()
    .notEmpty()
    .withMessage("Cycle is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Cycle must only consist of 1 to 255 characters"),
  body("interestRate").trim().notEmpty().withMessage("Interest rate is required").isNumeric().withMessage("Interest rate must be a number"),
  body("entries")
    .isArray()
    .withMessage("Entries must be an array")
    .custom(value => {
      if (!Array.isArray(value)) throw new Error("Invalid entries");
      if (value.length < 1) throw new Error("Atleast 1 entry is required");
      return true;
    }),
  body("entries.*.line").trim().notEmpty().withMessage("Line is required").isNumeric().withMessage("Line must be a number"),
  body("entries.*.clientId")
    .if(body("entries.*.clientId").notEmpty())
    .isMongoId()
    .withMessage("Invalid client id")
    .custom(async value => {
      const exists = await Customer.exists({ _id: value, deletedAt: null });
      if (!exists) throw new Error("Client not found");
      return true;
    }),
  body("entries.*.particular").if(body("entries.*.particular").notEmpty()).isLength({ min: 1, max: 255 }).withMessage("Particular must only contain 1 to 255 characters"),
  body("entries.*.acctCodeId")
    .if(body("entries.*.acctCodeId").notEmpty())
    .isMongoId()
    .withMessage("Invalid account code")
    .custom(async value => {
      const exists = await ChartOfAccount.exists({ _id: value, deletedAt: null });
      if (!exists) throw new Error("Account code not found");
      return true;
    }),
  body("entries.*.debit").if(body("entries.*.debit").notEmpty()).isNumeric().withMessage("Debit must be a number"),
  body("entries.*.credit").if(body("entries.*.credit").notEmpty()).isNumeric().withMessage("Credit must be a number"),
  body("entries.*.interest").if(body("entries.*.interest").notEmpty()).isNumeric().withMessage("Interest must be a number"),
  body("entries.*.cycle").if(body("entries.*.cycle").notEmpty()).isLength({ min: 1, max: 255 }).withMessage("Cycle must only consist of 1 to 255 characters"),
  body("entries.*.checkNo").if(body("entries.*.checkNo").notEmpty()).isLength({ min: 1, max: 255 }).withMessage("Check no. must only contain 1 to 255 characters"),
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

      const deletedIds = await Entry.countDocuments({ _id: { $in: value } }).exec();
      if (deletedIds !== value.length) {
        throw new Error("Please check all the deleted values");
      }

      return true;
    }),
];
