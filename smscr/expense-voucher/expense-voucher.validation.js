const { param, body } = require("express-validator");
const ExpenseVoucher = require("./expense-voucher.schema");
const Supplier = require("../supplier/supplier.schema");
const Bank = require("../banks/bank.schema");
const Transaction = require("../transactions/transaction.schema");

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
      const [transaction, expense] = await Promise.all([transactionExistsPromise, expenseVoucherExistsPromise]);
      if (transaction || expense) throw new Error("CV No. already exists");
      return true;
    }),
  body("supplier")
    .trim()
    .notEmpty()
    .withMessage("Supplier is required")
    .isMongoId()
    .withMessage("Invalid supplier id")
    .custom(async value => {
      const exists = await Supplier.exists({ _id: value, deletedAt: null });
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
  body("bankCode")
    .trim()
    .notEmpty()
    .withMessage("Bank code is required")
    .isMongoId()
    .withMessage("Invalid bank code id")
    .custom(async value => {
      const exists = await Bank.exists({ _id: value, deletedAt: null });
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
