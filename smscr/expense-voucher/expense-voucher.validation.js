const { param, body } = require("express-validator");
const ExpenseVoucher = require("./expense-voucher.schema");
const Supplier = require("../supplier/supplier.schema");
const Bank = require("../banks/bank.schema");
const Transaction = require("../transactions/transaction.schema");
const { isValidObjectId } = require("mongoose");
const ChartOfAccount = require("../chart-of-account/chart-of-account.schema");
const JournalVoucher = require("../journal-voucher/journal-voucher.schema");
const EmergencyLoan = require("../emergency-loan/emergency-loan.schema");
const DamayanFund = require("../damayan-fund/damayan-fund.schema");

exports.expenseVoucherIdRules = [
  param("id")
    .trim()
    .notEmpty()
    .withMessage("Expense voucher id is required")
    .isMongoId()
    .withMessage("Invalid expense voucher id")
    .custom(async value => {
      const exists = await ExpenseVoucher.exists({ _id: value, deletedAt: null });
      if (!exists) throw new Error("Expense voucher not found");
      return true;
    }),
];

exports.expenseVoucherRules = [
  body("code")
    .trim()
    .notEmpty()
    .withMessage("CV No is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("CV No must only consist of 1 to 255 characters")
    .custom(async value => {
      const transactionExistsPromise = Transaction.exists({ code: value.toUpperCase(), deletedAt: null });
      const expenseVoucherExistsPromise = ExpenseVoucher.exists({ code: value.toUpperCase(), deletedAt: null });
      const journalVoucherExistsPromise = JournalVoucher.exists({ code: value.toUpperCase(), deletedAt: null });
      const emergencyLoanExistsPromise = EmergencyLoan.exists({ code: value.toUpperCase(), deletedAt: null });
      const damayanFundExistsPromise = DamayanFund.exists({ code: value.toUpperCase(), deletedAt: null });

      const [transaction, expense, journal, emergency, damayan] = await Promise.all([
        transactionExistsPromise,
        expenseVoucherExistsPromise,
        journalVoucherExistsPromise,
        emergencyLoanExistsPromise,
        damayanFundExistsPromise,
      ]);
      if (transaction || expense || journal || emergency || damayan) throw new Error("JV No. already exists");
      return true;
    }),
  body("supplier")
    .trim()
    .notEmpty()
    .withMessage("Supplier is required")
    .custom(async (value, { req }) => {
      const supplierId = req.body.supplierId;
      const exists = await Supplier.exists({ _id: supplierId, deletedAt: null });
      if (!exists) throw new Error("Supplier not found");
      return true;
    }),
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
  body("remarks").if(body("remarks").notEmpty()).isLength({ min: 1, max: 255 }).withMessage("Remarks must only consist of 1 to 255 characters"),
  body("entries")
    .isArray()
    .withMessage("Entries must be an array")
    .custom(value => {
      if (!Array.isArray(value)) throw new Error("Invalid entries");
      if (value.length < 1) throw new Error("Atleast 1 entry is required");
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

exports.updateExpenseVoucherRules = [
  body("code")
    .trim()
    .notEmpty()
    .withMessage("CV No is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("CV No must only consist of 1 to 255 characters")
    .custom(async (value, { req }) => {
      const expenseVoucher = await ExpenseVoucher.findById(req.params.id).lean().exec();
      if (expenseVoucher.code.toUpperCase() !== value.toUpperCase()) {
        const transactionExistsPromise = Transaction.exists({ code: value.toUpperCase(), deletedAt: null });
        const expenseVoucherExistsPromise = ExpenseVoucher.exists({ code: value.toUpperCase(), deletedAt: null });
        const journalVoucherExistsPromise = JournalVoucher.exists({ code: value.toUpperCase(), deletedAt: null });
        const emergencyLoanExistsPromise = EmergencyLoan.exists({ code: value.toUpperCase(), deletedAt: null });
        const damayanFundExistsPromise = DamayanFund.exists({ code: value.toUpperCase(), deletedAt: null });

        const [transaction, expense, journal, emergency, damayan] = await Promise.all([
          transactionExistsPromise,
          expenseVoucherExistsPromise,
          journalVoucherExistsPromise,
          emergencyLoanExistsPromise,
          damayanFundExistsPromise,
        ]);
        if (transaction || expense || journal || emergency || damayan) throw new Error("JV No. already exists");
      }
      return true;
    }),
  body("supplier")
    .trim()
    .notEmpty()
    .withMessage("Supplier is required")
    .custom(async (value, { req }) => {
      const supplierId = req.body.supplierId;
      const exists = await Supplier.exists({ _id: supplierId, deletedAt: null });
      if (!exists) throw new Error("Supplier not found");
      return true;
    }),
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
  body("remarks").if(body("remarks").notEmpty()).isLength({ min: 1, max: 255 }).withMessage("Remarks must only consist of 1 to 255 characters"),
];
