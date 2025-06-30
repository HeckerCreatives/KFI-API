const { body, param } = require("express-validator");
const Loan = require("../loan/loan.schema.js");
const Center = require("../center/center.schema.js");
const Customer = require("../customer/customer.schema.js");
const ChartOfAccount = require("../chart-of-account/chart-of-account.schema.js");
const Transaction = require("./transaction.schema.js");
const Bank = require("../banks/bank.schema.js");
const ExpenseVoucher = require("../expense-voucher/expense-voucher.schema.js");
const JournalVoucher = require("../journal-voucher/journal-voucher.schema.js");

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
      const transactionExistsPromise = Transaction.exists({ code: value.toUpperCase(), deletedAt: null });
      const expenseVoucherExistsPromise = ExpenseVoucher.exists({ code: value.toUpperCase(), deletedAt: null });
      const journalVoucherExistsPromise = JournalVoucher.exists({ code: value.toUpperCase(), deletedAt: null });

      const [transaction, expense, journal] = await Promise.all([transactionExistsPromise, expenseVoucherExistsPromise, journalVoucherExistsPromise]);
      if (transaction || expense || journal) throw new Error("JV No. already exists");

      if (transaction || expense) {
        throw new Error("CV No. already exists");
      }

      return true;
    }),
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
  body("remarks").if(body("remarks").notEmpty()).isLength({ min: 1, max: 255 }).withMessage("Remarks must only consist of 1 to 255 characters"),
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
  body("checkNo").trim().notEmpty().withMessage("Check No. is required").isLength({ min: 1, max: 255 }).withMessage("Check No. must only contain 1 to 255 characters"),
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
    .withMessage("Bank Code is required")
    .isMongoId()
    .withMessage("Invalid bank code")
    .custom(async value => {
      const exists = await Bank.exists({ _id: value, deletedAt: null });
      if (!exists) throw new Error("Bank code not found");
      return true;
    }),
  body("amount").trim().notEmpty().withMessage("Amount is required").isNumeric().withMessage("Amount must be a number"),
  body("cycle").trim().notEmpty().withMessage("Cycle is required").isNumeric().withMessage("Cycle must be a number"),
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
  body("entries.*.cycle").if(body("entries.*.cycle").notEmpty()).isNumeric().withMessage("Cycle must be a number"),
  body("entries.*.checkNo").if(body("entries.*.checkNo").notEmpty()).isLength({ min: 1, max: 255 }).withMessage("Check no. must only contain 1 to 255 characters"),
];

exports.updateTransactionRules = [
  body("amount").trim().notEmpty().withMessage("Amount is required").isNumeric().withMessage("Amount must be a number"),
  body("cycle").trim().notEmpty().withMessage("Cycle is required").isNumeric().withMessage("Cycle must be a number"),
  body("interestRate").trim().notEmpty().withMessage("Interest rate is required").isNumeric().withMessage("Interest rate must be a number"),
];
