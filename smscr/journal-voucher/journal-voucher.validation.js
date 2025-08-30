const { param, body } = require("express-validator");
const JournalVoucher = require("./journal-voucher.schema");
const Bank = require("../banks/bank.schema");
const { isValidObjectId } = require("mongoose");
const ChartOfAccount = require("../chart-of-account/chart-of-account.schema");
const { isCodeUnique } = require("../../utils/code-checker");
const Customer = require("../customer/customer.schema");
const ExpenseVoucherEntry = require("../expense-voucher/entries/expense-voucher-entries.schema");

exports.journalVoucherIdRules = [
  param("id")
    .trim()
    .notEmpty()
    .withMessage("Journal voucher id is required")
    .isMongoId()
    .withMessage("Invalid journal voucher id")
    .custom(async value => {
      const exists = await JournalVoucher.exists({ _id: value, deletedAt: null });
      if (!exists) throw new Error("Journal Voucher not found");
      return true;
    }),
];

exports.journalVoucherRules = [
  body("code")
    .trim()
    .notEmpty()
    .withMessage("JV No is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("JV No must only consist of 1 to 255 characters")
    .custom(async value => {
      const isUnique = await isCodeUnique(value);
      if (!isUnique) throw new Error("JV No. already exists");
      return true;
    })
    .matches(/^JV#[\d-]+$/i)
    .withMessage("JV# must start with JV# followed by numbers or hyphens"),
  body("nature").if(body("nature").notEmpty()).trim().notEmpty().withMessage("Nature is required").withMessage("Nature must only consist of 1 to 255 characters"),
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
  body("refNo").if(body("refNo").notEmpty()).isLength({ min: 1, max: 255 }).withMessage("Reference No. must only consist of 1 to 255 characters"),
  body("bankLabel")
    .trim()
    .notEmpty()
    .withMessage("Bank code is required")
    .custom(async (value, { req }) => {
      const bankId = req.body.bank;
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
  body("remarks").if(body("remarks").notEmpty()).isLength({ min: 1, max: 255 }).withMessage("Particular must only consist of 1 to 255 characters"),
  body("entries")
    .isArray()
    .withMessage("Entries must be an array")
    .custom(value => {
      if (!Array.isArray(value)) throw new Error("Invalid entries");
      if (value.length < 1) throw new Error("Atleast 1 entry is required");
      return true;
    }),
  body("entries.*.clientLabel")
    .if(body("entries.*.clientLabel").notEmpty())
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Name must only contain 1 to 255 characters")
    .custom(async (value, { req, path }) => {
      const index = path.match(/entries\[(\d+)\]\.clientLabel/)[1];
      const entries = req.body.entries;

      if (!Array.isArray(entries)) throw new Error("Invalid entries");
      const clientId = entries[index].client;
      const exists = await Customer.exists({ _id: clientId, deletedAt: null });
      if (!exists) throw new Error("Client not found / deleted");
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
  body("entries.*.cvForRecompute")
    .if(body("entries.*.cvForRecompute").notEmpty())
    .isLength({ min: 1, max: 255 })
    .withMessage("CV for recompute must only contain 1 to 255 characters"),
];

exports.updateJournalVoucherRules = [
  body("code")
    .trim()
    .notEmpty()
    .withMessage("JV No is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("JV No must only consist of 1 to 255 characters")
    .custom(async (value, { req }) => {
      const journalVoucher = await JournalVoucher.findById(req.params.id).lean().exec();
      const newValue = journalVoucher.code.toUpperCase().startsWith("JV#") ? journalVoucher.code : `JV#${journalVoucher.code}`;
      if (newValue.toUpperCase() !== value.toUpperCase()) {
        const isUnique = await isCodeUnique(value);
        if (!isUnique) throw new Error("JV No. already exists");
      }
      return true;
    })
    .matches(/^JV#[\d-]+$/i)
    .withMessage("JV# must start with JV# followed by numbers or hyphens"),
  body("nature").if(body("nature").notEmpty()).trim().notEmpty().withMessage("Nature is required").withMessage("Nature must only consist of 1 to 255 characters"),
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
  body("refNo").if(body("refNo").notEmpty()).isLength({ min: 1, max: 255 }).withMessage("Reference No. must only consist of 1 to 255 characters"),
  body("bankLabel")
    .trim()
    .notEmpty()
    .withMessage("Bank code is required")
    .custom(async (value, { req }) => {
      const bankId = req.body.bank;
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
  body("remarks").if(body("remarks").notEmpty()).isLength({ min: 1, max: 255 }).withMessage("Particular must only consist of 1 to 255 characters"),
  body("entries")
    .isArray()
    .withMessage("Entries must be an array")
    .custom(value => {
      if (!Array.isArray(value)) throw new Error("Invalid entries");
      if (value.length < 1) throw new Error("Atleast 1 entry is required");
      return true;
    }),
  body("entries.*.clientLabel")
    .if(body("entries.*.clientLabel").notEmpty())
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Name must only contain 1 to 255 characters")
    .custom(async (value, { req, path }) => {
      const index = path.match(/entries\[(\d+)\]\.clientLabel/)[1];
      const entries = req.body.entries;

      if (!Array.isArray(entries)) throw new Error("Invalid entries");
      const clientId = entries[index].client;
      const exists = await Customer.exists({ _id: clientId, deletedAt: null });
      if (!exists) throw new Error("Client not found / deleted");
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
  body("entries.*.cvForRecompute")
    .if(body("entries.*.cvForRecompute").notEmpty())
    .isLength({ min: 1, max: 255 })
    .withMessage("CV for recompute must only contain 1 to 255 characters"),
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
    if (totalCredit + totalCredit !== amount) throw new Error("Total of debit and credit must be balanced with the amount field.");
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

      const deletedIds = await ExpenseVoucherEntry.countDocuments({ _id: { $in: value } }).exec();
      if (deletedIds !== value.length) {
        throw new Error("Please check all the deleted values");
      }

      return true;
    }),
];
